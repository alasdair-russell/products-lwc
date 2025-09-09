@IsTest
private class ProductService_Test {

    private class MockResp implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(200);
            res.setHeader('Content-Type', 'application/json');
            res.setBody('{"products":[{"id":"bordeaux","label":"Bordeaux"},{"id":"rioja","label":"Rioja"}]}');
            return res;
        }
    }

    @IsTest static void testGetProducts() {
        Test.setMock(HttpCalloutMock.class, new MockResp());
        Test.startTest();
        List<ProductService.ProductDTO> out = ProductService.getProducts();
        Test.stopTest();
        System.assertEquals(2, out.size());
        System.assertEquals('bordeaux', out[0].id);
        System.assertEquals('Bordeaux', out[0].label);
    }

    @IsTest static void testSaveCampaignProducts() {
        Campaign c = new Campaign(Name = 'Demo'); insert c;
        Test.startTest();
        ProductService.saveCampaignProducts(c.Id, new List<String>{'bordeaux','rioja'});
        Test.stopTest();
        Campaign reloaded = [SELECT Products__c FROM Campaign WHERE Id = :c.Id];
        System.assertEquals('bordeaux;rioja', reloaded.Products__c);
    }
}