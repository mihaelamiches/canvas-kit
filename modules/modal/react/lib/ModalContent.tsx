import * as React from 'react';
import ReactDOM from 'react-dom';
import styled from '@emotion/styled';
import {keyframes} from '@emotion/core';
import Popup, {
  PopupPadding,
  usePopupStack,
  useCloseOnEscape,
  useAssistiveHideSiblings,
  useFocusTrap,
} from '@workday/canvas-kit-react-popup';
import {PopupStack} from '@workday/canvas-kit-popup-stack';

import {ModalWidth} from './Modal';

export interface ModalContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Aria label will override aria-labelledby, it is used if there is no heading or we need custom label for popup
   */
  ariaLabel?: string;
  /**
   * The padding of the Modal. Accepts `zero`, `s`, or `l`.
   * @default PopupPadding.l
   */
  padding: PopupPadding;
  /**
   * The width of the Modal. Accepts `s` or `l`.
   * @default ModalWidth.s
   */
  width: ModalWidth;
  /**
   * The function called when the Modal is closed.
   * If this callback is provided, the Modal will have
   * an 'X' icon in the top-right corner. Without this callback, there is no 'X' icon and the Escape
   * key handling and clicking on the overlay will not do anything.
   */
  handleClose?: () => void;
  /**
   * The heading of the Modal.
   */
  heading: React.ReactNode;
  /**
   * Optional override of the auto-select functionality of the Modal. If this ref is defined, that element
   * will receive focus when the modal is opened. There are many suggestions to what that element should
   * be. Contact an accessibility specialist or go through the https://www.w3.org/TR/wai-aria-practices/
   * document for instances where this might be useful. Make sure this is a focusable ref, like a button.
   * If you're unsure, don't define this and leave it to the default behavior.
   * If this ref is not provided the modal will try to use the close icon. If that icon is not available,
   * it will make the modal heading focusable and focus on that instead.
   */
  firstFocusRef?: React.RefObject<HTMLElement>;
  /**
   * The containing element for the Modal elements. The Modal uses
   * {@link https://reactjs.org/docs/portals.html Portals} to place the DOM elements
   * of the Modal in a different place in the DOM to prevent issues with overflowed containers.
   * When the modal is opened, `aria-hidden` will be added to siblings to hide background
   * content from assistive technology like it is visibly hidden from sighted users. This property
   * should be set to the element that the application root goes - not containing element of content.
   * This should be a sibling or higher than the header and navigation elements of the application.
   * @default document.body
   */
  container?: HTMLElement;
  /**
   * The `aria-label` for the Popup close button.
   */
  closeButtonAriaLabel?: string;
}

const fadeIn = keyframes`
  from {
    background: none;
  }
  to {
    background: rgba(0,0,0,0.65);
  }
`;

const Container = styled('div')({
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  background: 'rgba(0,0,0,0.65)',
  animationName: `${fadeIn}`,
  animationDuration: '0.3s',
  // Allow overriding of animation in special cases
  '.wd-no-animation &': {
    animation: 'none',
  },
});

// This centering container helps fix an issue with Chrome. Chrome doesn't normally do subpixel
// positioning, but seems to when using flexbox centering. This messes up Popper calculations inside
// the Modal. The centering container forces a "center" pixel calculation by making sure the width
// is always an even number
const CenteringContainer = styled('div')({
  height: '100vh',
  display: 'flex',
  position: 'absolute',
  left: 0,
  top: 0,
  alignItems: 'center',
  justifyContent: 'center',
});

const transformOrigin = {
  horizontal: 'center',
  vertical: 'bottom',
} as const;

function getFirstElementToFocus(overlayEl: HTMLElement): HTMLElement {
  const modalEl = overlayEl.querySelector('[role=dialog]');
  const firstFocusable = modalEl?.querySelector<HTMLElement>(
    `[data-close=close],[id="${modalEl?.getAttribute('aria-labelledby')}"]`
  );
  if (firstFocusable) {
    if (firstFocusable.tagName === 'H3') {
      // If there is no close icon, we need to transfer focus to the header.
      // Setting tabIndex allows the header to be focusable.
      // We do the header instead of the next focusable element to prevent useful context from being skipped
      firstFocusable.tabIndex = 0;
      firstFocusable.style.outline = 'none';

      const changeTabIndex = () => {
        // We no longer need to focus on the header after it loses focus
        // We simply want to transfer focus inside
        firstFocusable.removeEventListener('blur', changeTabIndex);
        // We must wait one frame to ensure tabbable checks are satisfied
        // by all focus libraries...
        requestAnimationFrame(() => {
          firstFocusable.removeAttribute('tabIndex');
        });
      };
      firstFocusable.addEventListener('blur', changeTabIndex);
    }
    return firstFocusable;
  } else {
    throw new Error(
      'No focusable element was found. Please ensure modal has at least one focusable element'
    );
  }
}

const getFromWindow = <T extends any>(property: string, defaultValue: T): T => {
  if (typeof window !== undefined) {
    return (window as any)[property] ?? defaultValue;
  }
  return defaultValue;
};

const useWindowSize = (): {width: number; height: number} => {
  const [width, setWidth] = React.useState(getFromWindow('innerWidth', 0));
  const [height, setHeight] = React.useState(getFromWindow('innerHeight', 0));

  const onResize = () => {
    setWidth(window.innerWidth);
    setHeight(window.innerHeight);
  };
  React.useEffect(() => {
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return {width, height};
};

const useInitialFocus = (
  modalRef: React.RefObject<HTMLElement>,
  firstFocusRef: React.RefObject<HTMLElement> | undefined
) => {
  React.useLayoutEffect(() => {
    const handlerRef =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (modalRef.current) {
      const elem =
        (firstFocusRef && firstFocusRef.current) || getFirstElementToFocus(modalRef.current);
      elem.focus();
    }
    return () => {
      if (handlerRef) {
        handlerRef.focus();
      }
    };
  }, [modalRef, firstFocusRef]);
};

const ModalContent = ({
  ariaLabel,
  width = ModalWidth.s,
  padding = PopupPadding.l,
  container,
  handleClose,
  children,
  firstFocusRef,
  heading,
  closeButtonAriaLabel,
  ...elemProps
}: ModalContentProps) => {
  const centeringRef = React.useRef<HTMLDivElement>(null);
  const onClose = () => handleClose?.();

  const stackRef = usePopupStack();
  useCloseOnEscape(stackRef, onClose);
  useFocusTrap(stackRef);
  useInitialFocus(stackRef, firstFocusRef);
  useAssistiveHideSiblings(stackRef);

  React.useEffect(() => {
    // We don't use `useCloseOnOutsideClick` directly, so we add this data attribute manually
    stackRef.current?.setAttribute('data-behavior-click-outside-close', 'topmost');
  });

  // special handling for clicking on the overlay
  const onOverlayClick = (event: React.MouseEvent<HTMLElement>) => {
    // Detect clicks only on the centering wrapper element
    if (!stackRef.current) {
      return;
    }
    const elements = PopupStack.getElements()
      .sort((a, b) => Number(a.style.zIndex) - Number(b.style.zIndex))
      .filter(e => e.getAttribute('data-behavior-click-outside-close') === 'topmost');
    if (
      elements.length &&
      elements[elements.length - 1] === stackRef.current &&
      event.target === centeringRef.current
    ) {
      onClose();
    }
  };
  const windowSize = useWindowSize();

  const content = (
    <Container {...elemProps}>
      <CenteringContainer
        ref={centeringRef}
        style={{width: windowSize.width % 2 === 1 ? 'calc(100vw - 1px)' : '100vw'}}
        onMouseDown={onOverlayClick}
      >
        <Popup
          width={width}
          heading={heading}
          handleClose={handleClose}
          padding={padding}
          transformOrigin={transformOrigin}
          aria-modal={true}
          ariaLabel={ariaLabel}
          closeButtonAriaLabel={closeButtonAriaLabel}
        >
          {children}
        </Popup>
      </CenteringContainer>
    </Container>
  );

  // only render something on the client
  if (typeof window !== 'undefined') {
    return ReactDOM.createPortal(content, container || stackRef.current!);
  } else {
    return null;
  }
};

export default ModalContent;
