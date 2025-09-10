@IsTest
private class ProductLinkService_Test {

    private class MockResp implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(200);
            res.setHeader('Content-Type', 'application/json');
            res.setBody('{"products":[{"id":"bordeaux","label":"Bordeaux"},{"id":"rioja","label":"Rioja"},{"id":"tuscany","label":"Tuscany"}]}');
            return res;
        }
    }

    @IsTest static void testSyncSelectedProducts_createsProductsAndLinks() {
        Test.setMock(HttpCalloutMock.class, new MockResp());
        Campaign c = new Campaign(Name = 'Demo'); insert c;

        Test.startTest();
        ProductLinkService.syncSelectedProducts(c.Id, new List<String>{'bordeaux','rioja','tuscany'});
        Test.stopTest();

        Map<String, Product2> byCode = new Map<String, Product2>(
            [SELECT Id, ProductCode FROM Product2 WHERE ProductCode IN ('bordeaux','rioja','tuscany')]);
        System.assertEquals(3, byCode.size());

        List<CampaignProduct__c> links = [
            SELECT Id, Campaign__c, Product__r.ProductCode FROM CampaignProduct__c WHERE Campaign__c = :c.Id];
        System.assertEquals(3, links.size());
    }

    @IsTest static void testGetSelectedProductCodes() {
        Campaign c = new Campaign(Name = 'Demo2'); insert c;
        Product2 p = new Product2(Name = 'Rioja', ProductCode = 'rioja', IsActive = true); insert p;
        insert new CampaignProduct__c(Campaign__c = c.Id, Product__c = p.Id);

        Test.startTest();
        List<String> codes = ProductLinkService.getSelectedProductCodes(c.Id);
        Test.stopTest();

        System.assertEquals(1, codes.size());
        System.assertEquals('rioja', codes[0]);
    }

    @IsTest static void testSyncSelectedProducts_truncatesToThree() {
        Test.setMock(HttpCalloutMock.class, new MockResp());
        Campaign c = new Campaign(Name = 'Demo3'); insert c;

        Test.startTest();
        ProductLinkService.syncSelectedProducts(c.Id, new List<String>{'bordeaux','rioja','tuscany','extra'});
        Test.stopTest();

        Integer countLinks = [SELECT COUNT() FROM CampaignProduct__c WHERE Campaign__c = :c.Id];
        System.assertEquals(3, countLinks);
    }
}