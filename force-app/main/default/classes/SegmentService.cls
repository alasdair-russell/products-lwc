public with sharing class SegmentService {
    public class SegmentDTO { @AuraEnabled public String id; @AuraEnabled public String name; @AuraEnabled public String description; }
    public class Envelope { public List<SegmentDTO> segments; }
    private static final String NC_NAME = 'SegmentsAPI';
    private static final String PATH = '';
    @AuraEnabled(cacheable=true)
    public static List<SegmentDTO> getSegments() {
        Http h = new Http();
        HttpRequest req = new HttpRequest();
        req.setMethod('GET');
        req.setEndpoint('callout:' + NC_NAME + PATH);
        HttpResponse res = h.send(req);
        if (res.getStatusCode() >= 200 && res.getStatusCode() < 300) {
            Envelope env = (Envelope) JSON.deserialize(res.getBody(), Envelope.class);
            return env != null && env.segments != null ? env.segments : new List<SegmentDTO>();
        }
        throw new AuraHandledException('Failed to load segments, status ' + res.getStatus());
    }
    @AuraEnabled
    public static void saveCampaignSegment(Id campaignId, String segmentId, String segmentName) {
        if (campaignId == null) throw new AuraHandledException('Missing campaign Id');
        Campaign c = new Campaign(Id = campaignId);
        c.DataCloud_Segment_Id__c = segmentId;
        c.DataCloud_Segment_Name__c = segmentName;
        update c;
    }
}