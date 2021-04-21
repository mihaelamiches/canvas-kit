import * as h from '../helpers';

describe('Button', () => {
  before(() => {
    h.stories.visit();
  });

  context('given primary buttons are rendered', () => {
    beforeEach(() => {
      h.stories.load('Components/Buttons/Button/React/Secondary', 'Default');
    });

    it('should not have any axe errors', () => {
      cy.checkA11y();
    });

    it('should render the correct text', () => {
      cy.get('button')
        .first()
        .should('contain', 'Primary');
    });
  });

  context('given delete buttons are rendered', () => {
    beforeEach(() => {
      h.stories.load('Components/Buttons/Button/React', 'Delete');
    });

    it('should not have any axe errors', () => {
      cy.checkA11y();
    });

    it('should render the correct text', () => {
      cy.get('button')
        .first()
        .should('contain', 'Delete');
    });
  });
});
