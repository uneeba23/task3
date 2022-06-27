/** Core dependencies */


/** Third party dependencies */
const { expect } = require('chai');

const x2js = require('x2js');

const parser = new x2js();



const writeFile = (filepath, data) => new Cypress.Promise((resolve, reject) => {
    fs.writeFile(filepath, data, (err) => {
        if (err)
            return reject(err);

        resolve(data);
    });
});



const useUrl = 'https://www.screenbinge.com/sitemap.xml';

const uris = [];

const sitemapLocs = [];

uris.push(useUrl);

async function requestFunction(url) {

    Cypress.config('defaultCommandTimeout', 60000);

    /** Handing unhandled exceptions and errors */
    Cypress.on('uncaught:exception', (err, runnable) => {
        cy.log(err);
        return true;
    });

    let parentResponse;

    it(
        `Test parent xml: ${url}`, () => {
            cy.wrap(
                new Cypress.Promise((resolve, reject) =>
                    cy
                        .request(url)
                        .then(
                            response => {
                                expect(response)
                                    .not
                                    .eq(null)

                                parentResponse = response;

                                resolve();
                            }
                        )


                )
            );

            cy.wait(1);
        }
    )


    it('Checking for sitemap in index', () => {
        cy.wrap(
            new Cypress.Promise((resolve, reject) => {
                const { body: parentBody } = parentResponse;

                const parsed = parser.xml2js(parentBody);

                if (!parsed.sitemapindex)
                    throw new Error('No sitemap index found');

                const {
                    sitemapindex: {
                        sitemap
                    }
                } = parsed;

                sitemap
                    .map(sitemapObject => {
                        cy.log(`Added: ${sitemapObject.loc}`)
                        sitemapLocs.push(sitemapObject.loc);
                    });

                resolve();
            })
        )

        cy.wait(1);
    });

    let responses = [];

    it('All child webistes test', () => {
        sitemapLocs
            .forEach(
                locationToUse => {
                    cy.wrap(
                        new Cypress.Promise((resolve, reject) => {
                            cy.request(locationToUse)
                                .then(response => resolve({ response }));
                        })
                    )
                        .its('response')
                        .then(response => {
                            responses = responses.concat(response || []);
                        })
                }
            )

        cy.wait(1);
    });


    let childrenParsed = [];

    it('Checking and retreiving valid sub links for website', () => {
        responses
            .forEach(response => {

                const { body: childBody } = response;

                const {
                    urlset: {
                        url: urlArray
                    }
                } = parser.xml2js(childBody);

                if (Array.isArray(urlArray))
                    return childrenParsed = childrenParsed
                        .concat(
                            urlArray
                                .map(url => url.loc)
                        );

                childrenParsed.push(urlArray.loc);
            });

        cy.writeFile(
            'cypress/fixtures/SB/test.json',
            childrenParsed,
        );

        cy.wait(1);
    })
}

// it('Crawler', requestFunction.bind(null, useUrl));

describe('requestFunction', () => {
    requestFunction(useUrl);
})
