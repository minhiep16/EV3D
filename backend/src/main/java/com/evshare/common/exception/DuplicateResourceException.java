package com.evshare.common.exception;

public class DuplicateResourceException extends RuntimeException {
    private final String code;

    public DuplicateResourceException(String message) {
        super(message);
        this.code = "DUPLICATE_RESOURCE";
    }

    public DuplicateResourceException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
