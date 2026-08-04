package com.cognizant.agrilink.iam.identityAccess.controller;


import com.cognizant.agrilink.iam.identityAccess.dto.ChangePasswordRequestDto;
import com.cognizant.agrilink.iam.identityAccess.dto.LoginRequestDto;
import com.cognizant.agrilink.iam.identityAccess.dto.LoginResponseDto;
import com.cognizant.agrilink.iam.identityAccess.dto.RefreshTokenRequestDto;
import com.cognizant.agrilink.iam.identityAccess.dto.RegisterRequestDto;
import com.cognizant.agrilink.iam.identityAccess.model.UserDetails;
import com.cognizant.agrilink.iam.identityAccess.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/agriLink/session")
@RequiredArgsConstructor
public class SessionController {

    private final UserService userService;

    // POST /agriLink/session/login  — public
    @PostMapping("/login")
    public ResponseEntity<LoginResponseDto> login(@Valid @RequestBody LoginRequestDto dto,
                                                   HttpServletRequest request) {
        return ResponseEntity.ok(userService.login(dto, request));
    }

    // POST /agriLink/session/refresh  — public (access token may be expired)
    @PostMapping("/refresh")
    public ResponseEntity<LoginResponseDto> refresh(@Valid @RequestBody RefreshTokenRequestDto dto) {
        return ResponseEntity.ok(userService.refreshToken(dto.getRefreshToken()));
    }

    // POST /agriLink/session/register  — public (farmer self-registration, starts Pending)
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody RegisterRequestDto dto,
                                                         HttpServletRequest request) {
        var created = userService.register(dto, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Registration submitted. Pending approval.",
                        "userId", created.getUserId()));
    }

    // DELETE /agriLink/session/register/{id}  — public (rollback of a self-registration
    // that never got its linked profile; only works while the account is still Pending)
    @DeleteMapping("/register/{id}")
    public ResponseEntity<Map<String, String>> deleteRegistration(@PathVariable Integer id) {
        userService.deleteRegistration(id);
        return ResponseEntity.ok(Map.of("message", "Registration rolled back"));
    }

    // POST /agriLink/session/logout  — requires valid JWT
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
            @AuthenticationPrincipal UserDetails currentUser) {
        userService.logout(currentUser.getUserId());
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    // POST /agriLink/session/change-password  — authenticated user changes own password
    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            @Valid @RequestBody ChangePasswordRequestDto dto,
            @AuthenticationPrincipal UserDetails currentUser) {
        userService.changePassword(currentUser.getUserId(), dto);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }
}
