package com.evshare.fund.controller;

import com.evshare.fund.dto.PersonalExpensePaymentResponse;
import com.evshare.fund.dto.PersonalPaymentSubmitRequest;
import com.evshare.fund.dto.PersonalPaymentVerifyRequest;
import com.evshare.fund.service.PersonalPaymentService;
import com.evshare.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/expenses")
public class PersonalPaymentController {

    private final PersonalPaymentService personalPaymentService;

    public PersonalPaymentController(PersonalPaymentService personalPaymentService) {
        this.personalPaymentService = personalPaymentService;
    }

    /**
     * Submit payment information for a personal expense obligation
     */
    @PostMapping("/{expenseId}/personal-payments")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<PersonalExpensePaymentResponse> submitPersonalPayment(
            @PathVariable("expenseId") UUID expenseId,
            @Valid @RequestBody PersonalPaymentSubmitRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        PersonalExpensePaymentResponse response = personalPaymentService.submitPayment(expenseId, request, principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Staff/Admin lists pending personal payments (optionally filtered by vehicleId)
     */
    @GetMapping("/personal-payments/pending")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<List<PersonalExpensePaymentResponse>> getPendingPersonalPayments(
            @RequestParam(value = "vehicleId", required = false) UUID vehicleId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<PersonalExpensePaymentResponse> response = personalPaymentService.getPendingPayments(vehicleId, principal);
        return ResponseEntity.ok(response);
    }

    /**
     * Staff/Admin verifies receipt of personal payment funds (supports both PUT and POST)
     */
    @RequestMapping(
            value = "/personal-payments/{paymentId}/verify",
            method = {RequestMethod.PUT, RequestMethod.POST}
    )
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<PersonalExpensePaymentResponse> verifyPersonalPayment(
            @PathVariable("paymentId") UUID paymentId,
            @Valid @RequestBody PersonalPaymentVerifyRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        PersonalExpensePaymentResponse response = personalPaymentService.verifyPayment(paymentId, request, principal);
        return ResponseEntity.ok(response);
    }

    /**
     * List payment submissions for a specific expense
     */
    @GetMapping("/{expenseId}/personal-payments")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<List<PersonalExpensePaymentResponse>> getPaymentsForExpense(
            @PathVariable("expenseId") UUID expenseId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<PersonalExpensePaymentResponse> response = personalPaymentService.getPaymentsForExpense(expenseId, principal);
        return ResponseEntity.ok(response);
    }

    /**
     * List personal expense payments submitted by current user
     */
    @GetMapping("/my-personal-payments")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<List<PersonalExpensePaymentResponse>> getMyPersonalPayments(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<PersonalExpensePaymentResponse> response = personalPaymentService.getPaymentsForCurrentUser(principal);
        return ResponseEntity.ok(response);
    }
}
