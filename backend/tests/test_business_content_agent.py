import airtable_client


def test_record_to_content_post_maps_quality_and_research_fields():
    rec = {
        "id": "rec_content",
        "createdTime": "2026-09-02T20:00:00Z",
        "fields": {
            "Business": "AI Fiesta",
            "Business_Slug": "aifiesta",
            "Title": "Is AI Fiesta worth it for comparing AI models?",
            "Slug": "is-ai-fiesta-worth-it",
            "Meta_Description": "AI Fiesta reviews and public research show who benefits most from model comparison workflows.",
            "Buyer_Question": "Is AI Fiesta worth it for comparing AI models?",
            "Content_Type": "Case Study",
            "Content_HTML": "<article><p>Answer first.</p></article>",
            "Excerpt": "A research-backed buyer guide.",
            "Status": "needs_review",
            "Content_Brief_JSON": "{\"template\":\"case-study\"}",
            "Research_Packet_JSON": "{\"sources\":[]}",
            "Source_Review_IDs": "rec1,rec2",
            "Source_Signal_IDs": "sig1",
            "SEO_Score": 82,
            "AEO_Score": 84,
            "Quality_Score": 86,
            "Quality_Report_JSON": "{\"score\":86}",
            "Schema_JSON": "{\"@context\":\"https://schema.org\"}",
            "Published_At": "",
            "Updated_At": "2026-09-02T20:00:00Z",
            "Created_At": "2026-09-02T20:00:00Z",
        },
    }

    post = airtable_client.record_to_content_post(rec)

    assert post["business_slug"] == "aifiesta"
    assert post["status"] == "needs_review"
    assert post["quality_score"] == 86
    assert post["source_review_ids"] == ["rec1", "rec2"]
    assert post["content_brief"]["template"] == "case-study"
