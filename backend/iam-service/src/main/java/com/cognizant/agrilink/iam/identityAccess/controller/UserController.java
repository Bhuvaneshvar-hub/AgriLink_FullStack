package com.cognizant.agrilink.iam.identityAccess.controller;


import com.cognizant.agrilink.iam.identityAccess.dto.CreateUserRequestDto;
import com.cognizant.agrilink.iam.identityAccess.dto.ResetPasswordRequestDto;
import com.cognizant.agrilink.iam.identityAccess.dto.UpdateUserRequestDto;
import com.cognizant.agrilink.iam.identityAccess.dto.UserResponseDto;
import com.cognizant.agrilink.iam.identityAccess.model.UserDetails;
import com.cognizant.agrilink.iam.identityAccess.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/agriLink/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // POST /agriLink/user/createUser
    // AgriLinkAdmin can create any user; ExtensionOfficer can create Farmers only.
    // Coarse role gate is in SecurityConfig; the fine-grained rule is enforced in the service.
    @PostMapping("/createUser")
    public ResponseEntity<Map<String, String>> createUser(@Valid @RequestBody CreateUserRequestDto dto,
                                                          @AuthenticationPrincipal UserDetails currentUser) {
        userService.createUser(dto, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "User created successfully"));
    }

    // GET /agriLink/user  — list all users
    @GetMapping
    public ResponseEntity<List<UserResponseDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    // GET /agriLink/user/pending  — list users awaiting approval (Officer/Admin)
    @GetMapping("/pending")
    public ResponseEntity<List<UserResponseDto>> getPendingUsers() {
        return ResponseEntity.ok(userService.getPendingUsers());
    }

    // GET /agriLink/user/{id}  — get one user
    @GetMapping("/{id}")
    public ResponseEntity<UserResponseDto> getUser(@PathVariable Integer id) {
        return ResponseEntity.ok(userService.getUser(id));
    }

    // PUT /agriLink/user/{id}  — update a user
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, String>> updateUser(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateUserRequestDto dto) {
        userService.updateUser(id, dto);
        return ResponseEntity.ok(Map.of("message", "User updated successfully"));
    }

    // POST /agriLink/user/{id}/approve  — approve a pending (self-registered) user
    @PostMapping("/{id}/approve")
    public ResponseEntity<Map<String, String>> approveUser(
            @PathVariable Integer id,
            @AuthenticationPrincipal UserDetails currentUser) {
        userService.approveUser(id, currentUser);
        return ResponseEntity.ok(Map.of("message", "User approved successfully"));
    }

    // DELETE /agriLink/user/{id}  — soft delete (deactivate)
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable Integer id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(Map.of("message", "User deactivated successfully"));
    }

    // POST /agriLink/user/{id}/reset-password  — Admin resets a user's password
    @PostMapping("/{id}/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(
            @PathVariable Integer id,
            @Valid @RequestBody ResetPasswordRequestDto dto) {
        userService.resetPassword(id, dto);
        return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
    }
}
