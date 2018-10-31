const DOMSpy = require('../src/domSpy')

test('DOMSpy should load', () => {
  expect(new DOMSpy()).toBeDefined();

});