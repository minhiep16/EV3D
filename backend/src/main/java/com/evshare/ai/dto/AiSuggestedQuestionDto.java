package com.evshare.ai.dto;

public class AiSuggestedQuestionDto {

    private String id;
    private String category;
    private String label;
    private String query;
    private String iconType;

    public AiSuggestedQuestionDto() {
    }

    public AiSuggestedQuestionDto(String id, String category, String label, String query, String iconType) {
        this.id = id;
        this.category = category;
        this.label = label;
        this.query = query;
        this.iconType = iconType;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getQuery() {
        return query;
    }

    public void setQuery(String query) {
        this.query = query;
    }

    public String getIconType() {
        return iconType;
    }

    public void setIconType(String iconType) {
        this.iconType = iconType;
    }
}

