const { expect } = require("chai");


it('BestVpn', function () {
    cy.visit('https://www.bestvpn.co/')
    cy.contains("a").should("not.have.attr", "href", "#undefined");
})

function requestFunction(url) {

    try {
        /** Visiting URI or webpage */
        cy.visit(url);
    } catch (exc) {
        cy.log(exc);
    }

    /** Handing unhandled exceptions and errors */
    Cypress.on('uncaught:exception', (err, runnable) => {
        return true;
    });

    /** Waiting for first Anchor (a) tags to be visible, would wait
     * up to 60000 milliseconds or 15 seconds
     */
    cy
        .get(
            'a',
            { timeout: 60000 }
        )
        .should('be.visible');

    /** Anchor HREFs to skip in tags that are forced by developers */
    let skipHrefs = [
        'javascript:void(0);',
        '/',
        '/#',
        '#',
    ];

    /** Getting all anchor tags on page and iterating over them one by one */
    cy
        .get('a')
        .each(function (element) {

            const href = element[0].href;

            /** If href exists,
             * does not use hash locations and
             * skip hrefs if they are in the array to skipHrefs
             * */
            if (
                href
                && !href.includes('#')
                && !skipHrefs.includes(href)
            ) {
                /** Send a request to the uri and check if the response status is 200 */
                cy
                    .request(href)
                    .should(response => {
                        expect(response.status).to.not.eq(404)
                    });

                requestFunction(href)
            }
        })

}

const useUrl = 'https://www.bestvpn.co/';

it.only('SB', requestFunction.bind(null, useUrl))
