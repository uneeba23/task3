/** Third party dependencies */
const chai = require('chai');

const { expect } = chai;

const sinon = require('sinon');


/** Local statics and configuration */
const pageLinks = require('../../fixtures/vpnranks/test.json');


chai.use(require('sinon-chai'));


let failed = [];

let writeToFile = [];

const cssPathFinder = function (el) {
    if (!(el instanceof Element))
        return;

    var path = [];

    while (el.nodeType === Node.ELEMENT_NODE) {
        var selector = el.nodeName.toLowerCase();
        if (el.id) {
            selector += '#' + el.id;
            path.unshift(selector);
            break;
        } else {
            var sib = el, nth = 1;
            while (sib = sib.previousElementSibling) {
                if (sib.nodeName.toLowerCase() == selector)
                    nth++;
            }
            if (nth != 1)
                selector += ":nth-of-type(" + nth + ")";
        }
        path.unshift(selector);
        el = el.parentNode;
    }

    return path.join(" > ");
}


describe('Testing all pages', () => {
    /** Handing unhandled exceptions and errors */
    Cypress.on('uncaught:exception', (err, runnable) => {
        return false;
    });

    it('Creating report file', () => {
        cy.writeFile('cypress/fixtures/vpnranks/report.csv', 'Path, CssPath, HREF\r\n');
    });

    pageLinks
        .forEach((locationToUse) => {

            describe(`Checking Website ${locationToUse}`, () => {
                it(`Visit website: ${locationToUse}`, () => {
                    
                    cy.visit(locationToUse);
                });

                it(`Checking Anchor tags`, () => {
                    try {

                        cy
                            .get(
                                'a',
                                { timeout: 60000 }
                            )
                            .should('be.visible');


                        /** Getting all anchor tags on page and iterating over them one by one */
                        cy
                            .get('a')
                            .each((element) => {

                                const [useElement] = element;

                                const { href } = useElement;

                                const cssPath = cssPathFinder(useElement);

                                const found = failed.find(
                                    ({
                                        href: hrefFound,
                                        cssPath: cssPathFound,
                                        path: pathFound
                                    }) => (
                                        href === hrefFound &&
                                        cssPath === cssPathFound
                                    )
                                )

                                if (!!found)
                                    return cy.log(`Already tested: ${JSON.stringify(found)}`);

                                failed.push({
                                    href,
                                    path: locationToUse,
                                    cssPath,
                                });

                                expect(useElement)
                                    .to.have.property('href')
                                    .not.contain('undefined')
                                    .not.contain('javascript:void(0);');


                                cy
                                    .request(href, { failOnStatusCode: false })
                                    .then(innerAnchorResponse => {
                                        const { status } = innerAnchorResponse;

                                        expect(status)
                                            .to
                                            .eq(200);

                                        failed = failed
                                            .filter(object => object.href !== href);
                                    })
                            })
                            .then(anchorArray => cy.log(`Tested ${anchorArray.length} links on ${locationToUse}`));
                    } catch (exc) {
                        cy.log('EXCEPTION: ');
                        cy.log(JSON.stringify(exc));
                        cy.log(`The url: ${requestUrl}`);
                    }
                });

                it('Adding to write queue file', () => {
                    failed
                        .forEach(
                            task => {
                                const {
                                    href,
                                    path,
                                    cssPath: cssPathToUse
                                } = task;

                                writeToFile
                                    .push(
                                        `\r\n${path},${cssPathToUse},${href}`
                                    )
                            }
                        )
                })
            })

        });

    it(`Writing to file`, () => {
        const contentToAdd = writeToFile.join('');

        cy.writeFile('cypress/fixtures/vpnranks/report.csv', contentToAdd, { flag: 'a+' });
    });
});