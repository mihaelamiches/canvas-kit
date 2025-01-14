import * as h from '../helpers';

describe('PopupStack', () => {
  before(() => {
    h.stories.visit();
  });

  beforeEach(() => {
    h.stories.load('Testing/React/Popups/Popup Stack', 'MixedPopupTypes');
  });

  it('should start with Window 3 stacked on top of 3 Windows', () => {
    cy.findByRole('dialog', {name: 'Window 3'})
      .should(h.popup.beOnTopOfLabelledByText('Window 2'))
      .should(h.popup.beOnTopOfLabelledByText('Window 4'))
      .should(h.popup.beOnTopOfLabelledByText('Window 1'));
  });

  context('when Window 2 is clicked', () => {
    beforeEach(() => {
      cy.findByLabelText('Window 2').click();
    });

    it('should place Window 2 above others', () => {
      cy.findByRole('dialog', {name: 'Window 2'})
        .should(h.popup.beOnTopOfLabelledByText('Window 3'))
        .should(h.popup.beOnTopOfLabelledByText('Window 1'));
    });
  });

  context('when "Contents of Window 1" text is hovered', () => {
    beforeEach(() => {
      cy.findByText('Contents of Window 1').trigger('mouseover');
    });

    it('should place Window 1 Tooltip above all other stacked UI elements', () => {
      cy.findByRole('tooltip', {name: 'Really long tooltip showing how popup stacks overlap 1'})
        .should(h.popup.beOnTopOfLabelledByText('Window 1'))
        .should(h.popup.beOnTopOfLabelledByText('Window 2'))
        .should(h.popup.beOnTopOfLabelledByText('Window 4'));
    });
  });

  context('when "Delete Item" button is clicked', () => {
    beforeEach(() => {
      cy.contains('button', 'Delete Item').click();
    });

    it('should open "Delete Item" popup', () => {
      cy.findByRole('dialog', {name: 'Delete Item'}).should('be.visible');
    });

    context('when Window 2 is clicked', () => {
      beforeEach(() => {
        cy.findByRole('dialog', {name: 'Window 2'}).click();
      });

      it('should close "Delete Item" popup', () => {
        cy.findByLabelText('Delete Item').should('not.exist');
      });

      it('should place Window 2 above others', () => {
        cy.findByRole('dialog', {name: 'Window 2'})
          .should(h.popup.beOnTopOfLabelledByText('Window 1'))
          .should(h.popup.beOnTopOfLabelledByText('Window 3'));
      });
    });

    context('when Window 2 Tooltip is hovered', () => {
      beforeEach(() => {
        cy.findByText('Contents of Window 2').trigger('mouseover');
      });

      context('when "Contents of Window 2" text is clicked', () => {
        beforeEach(() => {
          cy.findByText('Contents of Window 2').click();
        });

        it('should close "Delete Item" popup', () => {
          cy.findByRole('dialog', {name: 'Delete Item'}).should('not.exist');
        });

        it('should place Window 2 above others', () => {
          cy.findByRole('dialog', {name: 'Window 2'})
            .should(h.popup.beOnTopOfLabelledByText('Window 1'))
            .should(h.popup.beOnTopOfLabelledByText('Window 3'));
        });
      });

      context('when the Escape key is pressed', () => {
        beforeEach(() => {
          cy.get('html').trigger('keydown', {
            key: 'Escape',
          });
        });

        it('should close the Tooltip', () => {
          cy.findByRole('tooltip', {
            name: 'Really long tooltip showing how popup stacks overlap 1',
          }).should('not.exist');
        });

        it('should not close the "Delete Item" popup', () => {
          cy.findByRole('dialog', {name: 'Delete Item'}).should('be.visible');
        });

        context('when the Escape key is pressed again', () => {
          beforeEach(() => {
            cy.get('html').trigger('keydown', {
              key: 'Escape',
            });
          });

          it('should close the "Delete Item" popup', () => {
            cy.findByRole('dialog', {name: 'Delete Item'}).should('not.exist');
          });
        });
      });
    });

    context('when an area outside popups is clicked', () => {
      beforeEach(() => {
        cy.get('html').click('bottomRight');
      });

      it('should close "Delete Item" popup', () => {
        cy.findByRole('dialog', {name: 'Delete Item'}).should('not.exist');
      });
    });

    context('when the Escape key is pressed', () => {
      beforeEach(() => {
        cy.get('html').trigger('keydown', {
          key: 'Escape',
        });
      });

      it('should close "Delete Item" popup', () => {
        cy.findByRole('dialog', {name: 'Delete Item'}).should('not.exist');
      });
    });

    context('when the "Delete" button is clicked', () => {
      beforeEach(() => {
        cy.findByRole('button', {name: 'Delete'}).click();
      });

      it('should open the "Really Delete Item" popup', () => {
        cy.findByRole('dialog', {name: 'Really Delete Item'}).should('be.visible');
      });

      context('when "Contents of Window 2" text is focused', () => {
        beforeEach(() => {
          cy.findByText('Contents of Window 2').focus();
        });

        it('should open the tooltip', () => {
          cy.findByRole('tooltip', {
            name: 'Really long tooltip showing how popup stacks overlap 2',
          }).should('be.visible');
        });

        context('when an area outside popups is clicked', () => {
          beforeEach(() => {
            cy.get('html').click();
          });

          it('should close the tooltip', () => {
            cy.findByRole('tooltip', {
              name: 'Really long tooltip showing how popup stacks overlap 2',
            }).should('not.be.visible');
          });

          it('should close the "Really Delete Item" popup', () => {
            cy.findByRole('dialog', {name: 'Really Delete Item'}).should('be.not.visible');
          });

          it('should NOT close the "Delete Item" popup', () => {
            cy.findByRole('dialog', {name: 'Delete Item'}).should('be.visible');
          });
        });
      });
    });
  });
});
