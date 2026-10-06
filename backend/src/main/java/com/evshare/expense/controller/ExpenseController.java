package com.evshare.expense.controller;

import com.evshare.expense.dto.CostSharingSummaryResponse;
import com.evshare.expense.dto.CreateExpenseRequest;
import com.evshare.expense.dto.ExpenseResponse;
import com.evshare.expense.dto.ExpenseShareResponse;
import com.evshare.expense.dto.ExpenseSummaryResponse;
import com.evshare.expense.entity.ExpenseCategory;
import com.evshare.expense.service.ExpenseService;
import com.evshare.expense.service.ExpenseShareService;
import com.evshare.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class ExpenseController {

    private final ExpenseService expenseService;
    private final ExpenseShareService expenseShareService;

    public ExpenseController(ExpenseService expenseService, ExpenseShareService expenseShareService) {
        this.expenseService = expenseService;
        this.expenseShareService = expenseShareService;
    }

    /**
     * Record a new vehicle expense
     */
    @PostMapping("/expenses")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<ExpenseResponse> recordExpense(
            @Valid @RequestBody CreateExpenseRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        ExpenseResponse created = expenseService.recordExpense(request, principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * List vehicle expenses with filtering
     */
    @GetMapping("/expenses")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<List<ExpenseResponse>> getExpenses(
            @RequestParam UUID vehicleId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(required = false) ExpenseCategory category,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<ExpenseResponse> list = expenseService.getExpenses(vehicleId, from, to, category, principal);
        return ResponseEntity.ok(list);
    }

    /**
     * Monthly expense summary for vehicle
     */
    @GetMapping("/expenses/summary")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<ExpenseSummaryResponse> getMonthlySummary(
            @RequestParam UUID vehicleId,
            @RequestParam(required = false) String month,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        ExpenseSummaryResponse summary = expenseService.getMonthlySummary(vehicleId, month, principal);
        return ResponseEntity.ok(summary);
    }

    /**
     * Get single expense details by ID
     */
    @GetMapping("/expenses/{expenseId}")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<ExpenseResponse> getExpenseById(
            @PathVariable UUID expenseId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        ExpenseResponse expense = expenseService.getExpenseById(expenseId, principal);
        return ResponseEntity.ok(expense);
    }

    /**
     * Nested convenience endpoint: GET /api/vehicles/{vehicleId}/expenses
     */
    @GetMapping("/vehicles/{vehicleId}/expenses")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<List<ExpenseResponse>> getExpensesByVehicle(
            @PathVariable UUID vehicleId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(required = false) ExpenseCategory category,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<ExpenseResponse> list = expenseService.getExpenses(vehicleId, from, to, category, principal);
        return ResponseEntity.ok(list);
    }

    /**
     * Nested convenience endpoint: GET /api/vehicles/{vehicleId}/expenses/summary
     */
    @GetMapping("/vehicles/{vehicleId}/expenses/summary")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<ExpenseSummaryResponse> getMonthlySummaryByVehicle(
            @PathVariable UUID vehicleId,
            @RequestParam(required = false) String month,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        ExpenseSummaryResponse summary = expenseService.getMonthlySummary(vehicleId, month, principal);
        return ResponseEntity.ok(summary);
    }

    /**
     * Get authoritative cost-sharing allocations for an expense
     */
    @GetMapping("/expenses/{expenseId}/shares")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<List<ExpenseShareResponse>> getExpenseShares(
            @PathVariable UUID expenseId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<ExpenseShareResponse> shares = expenseShareService.getExpenseShares(expenseId, principal);
        return ResponseEntity.ok(shares);
    }

    /**
     * Monthly cost-sharing summary for vehicle
     */
    @GetMapping("/expenses/shares/summary")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<CostSharingSummaryResponse> getCostSharingSummary(
            @RequestParam UUID vehicleId,
            @RequestParam(required = false) String month,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        CostSharingSummaryResponse summary = expenseShareService.getCostSharingSummary(vehicleId, month, principal);
        return ResponseEntity.ok(summary);
    }

    /**
     * Nested convenience endpoint: GET /api/vehicles/{vehicleId}/expenses/shares/summary
     */
    @GetMapping("/vehicles/{vehicleId}/expenses/shares/summary")
    @PreAuthorize("hasAnyRole('CO_OWNER', 'STAFF', 'ADMIN')")
    public ResponseEntity<CostSharingSummaryResponse> getCostSharingSummaryByVehicle(
            @PathVariable UUID vehicleId,
            @RequestParam(required = false) String month,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        CostSharingSummaryResponse summary = expenseShareService.getCostSharingSummary(vehicleId, month, principal);
        return ResponseEntity.ok(summary);
    }
}
