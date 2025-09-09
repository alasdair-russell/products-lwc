@IsTest
private class SegmentService_Test {
    private class MockResp implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(200);
            res.setHeader('Content-Type', 'application/json');
            res.setBody('{"segments":[{"id":"seg1","name":"Segment One","description":"Test seg"}]}');
            return res;
        }
    }
    @IsTest static void testGetSegments() {
        Test.setMock(HttpCalloutMock.class, new MockResp());
        Test.startTest();
        List<SegmentService.SegmentDTO> out = SegmentService.getSegments();
        Test.stopTest();
        System.assertEquals(1, out.size());
        System.assertEquals('seg1', out[0].id);
        System.assertEquals('Segment One', out[0].name);
    }
    @IsTest static void testSaveCampaignSegment() {
        Campaign c = new Campaign(Name = 'Seg Demo'); insert c;
        Test.startTest();
        SegmentService.saveCampaignSegment(c.Id, 'segX', 'Segment X');
        Test.stopTest();
        Campaign r = [SELECT DataCloud_Segment_Id__c, DataCloud_Segment_Name__c FROM Campaign WHERE Id = :c.Id];
        System.assertEquals('segX', r.DataCloud_Segment_Id__c);
        System.assertEquals('Segment X', r.DataCloud_Segment_Name__c);
    }
}