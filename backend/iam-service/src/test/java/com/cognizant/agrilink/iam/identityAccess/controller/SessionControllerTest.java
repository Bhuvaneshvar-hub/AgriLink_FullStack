package com.cognizant.agrilink.iam.identityAccess.controller;

import com.cognizant.agrilink.iam.exception.GlobalExceptionHandler;
import com.cognizant.agrilink.iam.identityAccess.dto.LoginResponseDto;
import com.cognizant.agrilink.iam.identityAccess.model.UserDetails;
import com.cognizant.agrilink.iam.identityAccess.model.UserRole;
import com.cognizant.agrilink.iam.identityAccess.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class SessionControllerTest {

    private UserService userService;
    private MockMvc mockMvc;

    private final UserDetails user = UserDetails.builder()
            .userId(1).email("admin@a.com")
            .role(UserRole.builder().roleId(1).roleName("AgriLinkAdmin").build())
            .status(UserDetails.Status.A).build();

    @BeforeEach
    void setUp() {
        userService = mock(UserService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new SessionController(userService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(principalResolver(user))
                .build();
    }

    private LoginResponseDto loginResponse() {
        return LoginResponseDto.builder()
                .accessToken("access").refreshToken("refresh").expiresIn(900)
                .userId(1).roleName("AgriLinkAdmin").regionId(1).build();
    }

    // ── login ───────────────────────────────────────────────────────────────
    @Test
    void login_valid_returns200() throws Exception {
        when(userService.login(any(), any(HttpServletRequest.class))).thenReturn(loginResponse());

        mockMvc.perform(post("/agriLink/session/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@a.com\",\"password\":\"Admin@1234\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("access"))
                .andExpect(jsonPath("$.roleName").value("AgriLinkAdmin"));
    }

    @Test
    void login_blankEmail_returns400() throws Exception {
        mockMvc.perform(post("/agriLink/session/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"password\":\"Admin@1234\"}"))
                .andExpect(status().isBadRequest());
        verify(userService, never()).login(any(), any());
    }

    @Test
    void login_badCredentials_returns401() throws Exception {
        when(userService.login(any(), any(HttpServletRequest.class)))
                .thenThrow(new IllegalArgumentException("Invalid email or password"));

        mockMvc.perform(post("/agriLink/session/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@a.com\",\"password\":\"bad\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    // ── refresh ───────────────────────────────────────────────────────────────
    @Test
    void refresh_valid_returns200() throws Exception {
        when(userService.refreshToken(eq("tok"))).thenReturn(loginResponse());

        mockMvc.perform(post("/agriLink/session/refresh")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"refreshToken\":\"tok\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("access"));
    }

    @Test
    void refresh_blank_returns400() throws Exception {
        mockMvc.perform(post("/agriLink/session/refresh")
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void refresh_invalid_returns401() throws Exception {
        when(userService.refreshToken(any()))
                .thenThrow(new IllegalArgumentException("Invalid refresh token"));

        mockMvc.perform(post("/agriLink/session/refresh")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"refreshToken\":\"bad\"}"))
                .andExpect(status().isUnauthorized());
    }

    // ── register ────────────────────────────────────────────────────────────
    @Test
    void register_valid_returns201() throws Exception {
        mockMvc.perform(post("/agriLink/session/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Ravi\",\"email\":\"ravi@a.com\",\"password\":\"Secret@12\",\"phone\":\"9876543210\",\"regionId\":7}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Registration submitted. Pending approval."));
        verify(userService).register(any(), any(HttpServletRequest.class));
    }

    @Test
    void register_badPhone_returns400() throws Exception {
        mockMvc.perform(post("/agriLink/session/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Ravi\",\"email\":\"ravi@a.com\",\"password\":\"Secret@12\",\"phone\":\"123\"}"))
                .andExpect(status().isBadRequest());
        verify(userService, never()).register(any(), any());
    }

    @Test
    void register_duplicate_returns409() throws Exception {
        doThrow(new IllegalStateException("Email already registered"))
                .when(userService).register(any(), any(HttpServletRequest.class));

        mockMvc.perform(post("/agriLink/session/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Ravi\",\"email\":\"ravi@a.com\",\"password\":\"Secret@12\",\"phone\":\"9876543210\"}"))
                .andExpect(status().isConflict());
    }

    // ── logout ───────────────────────────────────────────────────────────────
    @Test
    void logout_returns200() throws Exception {
        mockMvc.perform(post("/agriLink/session/logout"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Logged out successfully"));
        verify(userService).logout(1);
    }

    // ── change password ───────────────────────────────────────────────────────
    @Test
    void changePassword_valid_returns200() throws Exception {
        mockMvc.perform(post("/agriLink/session/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"Admin@1234\",\"newPassword\":\"NewSecret@2026\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password changed successfully"));
        verify(userService).changePassword(eq(1), any());
    }

    @Test
    void changePassword_shortNew_returns400() throws Exception {
        mockMvc.perform(post("/agriLink/session/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"Admin@1234\",\"newPassword\":\"short\"}"))
                .andExpect(status().isBadRequest());
        verify(userService, never()).changePassword(any(), any());
    }

    @Test
    void changePassword_wrongCurrent_returns401() throws Exception {
        doThrow(new IllegalArgumentException("Current password is incorrect"))
                .when(userService).changePassword(eq(1), any());

        mockMvc.perform(post("/agriLink/session/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"bad\",\"newPassword\":\"NewSecret@2026\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Current password is incorrect"));
    }

    // ── helper: supply @AuthenticationPrincipal in standalone MockMvc ─────────
    private HandlerMethodArgumentResolver principalResolver(UserDetails u) {
        return new HandlerMethodArgumentResolver() {
            @Override public boolean supportsParameter(MethodParameter p) {
                return p.hasParameterAnnotation(AuthenticationPrincipal.class);
            }
            @Override public Object resolveArgument(MethodParameter p, ModelAndViewContainer mav,
                                                    NativeWebRequest req, WebDataBinderFactory bf) {
                return u;
            }
        };
    }
}
