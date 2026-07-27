package com.cognizant.agrilink.iam.identityAccess.controller;

import com.cognizant.agrilink.iam.exception.ForbiddenException;
import com.cognizant.agrilink.iam.exception.GlobalExceptionHandler;
import com.cognizant.agrilink.iam.exception.ResourceNotFoundException;
import com.cognizant.agrilink.iam.identityAccess.dto.UserResponseDto;
import com.cognizant.agrilink.iam.identityAccess.model.UserDetails;
import com.cognizant.agrilink.iam.identityAccess.model.UserRole;
import com.cognizant.agrilink.iam.identityAccess.service.UserService;
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

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class UserControllerTest {

    private UserService userService;
    private MockMvc mockMvc;

    private final UserDetails admin = UserDetails.builder()
            .userId(1).email("admin@a.com")
            .role(UserRole.builder().roleId(1).roleName("AgriLinkAdmin").build())
            .status(UserDetails.Status.A).build();

    @BeforeEach
    void setUp() {
        userService = mock(UserService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new UserController(userService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(principalResolver(admin))
                .build();
    }

    private UserResponseDto sampleUser() {
        return UserResponseDto.builder()
                .userId(2).name("Ravi").email("ravi@a.com").phone("9876543210")
                .roleName("Farmer").regionId(7).status("A").build();
    }

    private static final String VALID_CREATE = """
            {"roleId":6,"name":"Ravi","email":"ravi@a.com","password":"Secret@12","phone":"9876543210","regionId":7}""";

    // ── createUser ───────────────────────────────────────────────────────────
    @Test
    void createUser_valid_returns201() throws Exception {
        when(userService.createUser(any(), any())).thenReturn(sampleUser());

        mockMvc.perform(post("/agriLink/user/createUser")
                        .contentType(MediaType.APPLICATION_JSON).content(VALID_CREATE))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("User created successfully"))
                .andExpect(jsonPath("$.data").doesNotExist());
    }

    @Test
    void createUser_missingEmail_returns400() throws Exception {
        String body = """
                {"roleId":6,"name":"Ravi","password":"Secret@12","phone":"9876543210"}""";
        mockMvc.perform(post("/agriLink/user/createUser")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest());
        verify(userService, never()).createUser(any(), any());
    }

    @Test
    void createUser_badPhone_returns400() throws Exception {
        String body = """
                {"roleId":6,"name":"Ravi","email":"ravi@a.com","password":"Secret@12","phone":"123"}""";
        mockMvc.perform(post("/agriLink/user/createUser")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createUser_duplicateEmail_returns409() throws Exception {
        when(userService.createUser(any(), any()))
                .thenThrow(new IllegalStateException("Email already registered"));

        mockMvc.perform(post("/agriLink/user/createUser")
                        .contentType(MediaType.APPLICATION_JSON).content(VALID_CREATE))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Email already registered"));
    }

    @Test
    void createUser_forbidden_returns403() throws Exception {
        when(userService.createUser(any(), any()))
                .thenThrow(new ForbiddenException("ExtensionOfficer can only create Farmer accounts"));

        mockMvc.perform(post("/agriLink/user/createUser")
                        .contentType(MediaType.APPLICATION_JSON).content(VALID_CREATE))
                .andExpect(status().isForbidden());
    }

    // ── approve ──────────────────────────────────────────────────────────────
    @Test
    void approveUser_returns200() throws Exception {
        when(userService.approveUser(eq(5), any())).thenReturn(sampleUser());

        mockMvc.perform(post("/agriLink/user/5/approve"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("User approved successfully"));
        verify(userService).approveUser(eq(5), any());
    }

    @Test
    void approveUser_alreadyActive_returns409() throws Exception {
        when(userService.approveUser(eq(5), any()))
                .thenThrow(new IllegalStateException("User is already active"));

        mockMvc.perform(post("/agriLink/user/5/approve"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("User is already active"));
    }

    // ── read ───────────────────────────────────────────────────────────────
    @Test
    void getAllUsers_returns200() throws Exception {
        when(userService.getAllUsers()).thenReturn(List.of(sampleUser()));

        mockMvc.perform(get("/agriLink/user"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].email").value("ravi@a.com"));
    }

    @Test
    void getUser_returns200() throws Exception {
        when(userService.getUser(2)).thenReturn(sampleUser());

        mockMvc.perform(get("/agriLink/user/2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(2));
    }

    @Test
    void getUser_notFound_returns404() throws Exception {
        when(userService.getUser(99)).thenThrow(new ResourceNotFoundException("User not found with id: 99"));

        mockMvc.perform(get("/agriLink/user/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("User not found with id: 99"));
    }

    // ── update ───────────────────────────────────────────────────────────────
    @Test
    void updateUser_returns200() throws Exception {
        when(userService.updateUser(eq(2), any())).thenReturn(sampleUser());

        mockMvc.perform(put("/agriLink/user/2")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"regionId\":9}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("User updated successfully"));
    }

    @Test
    void updateUser_invalidStatus_returns400() throws Exception {
        mockMvc.perform(put("/agriLink/user/2")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"X\"}"))
                .andExpect(status().isBadRequest());
        verify(userService, never()).updateUser(any(), any());
    }

    // ── delete ───────────────────────────────────────────────────────────────
    @Test
    void deleteUser_returns200() throws Exception {
        mockMvc.perform(delete("/agriLink/user/2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("User deactivated successfully"));
        verify(userService).deleteUser(2);
    }

    // ── reset password ─────────────────────────────────────────────────────
    @Test
    void resetPassword_valid_returns200() throws Exception {
        mockMvc.perform(post("/agriLink/user/2/reset-password")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"newPassword\":\"Temp@1234\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password reset successfully"));
        verify(userService).resetPassword(eq(2), any());
    }

    @Test
    void resetPassword_tooShort_returns400() throws Exception {
        mockMvc.perform(post("/agriLink/user/2/reset-password")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"newPassword\":\"short\"}"))
                .andExpect(status().isBadRequest());
        verify(userService, never()).resetPassword(any(), any());
    }

    // ── helper: supply @AuthenticationPrincipal in standalone MockMvc ─────────
    private HandlerMethodArgumentResolver principalResolver(UserDetails user) {
        return new HandlerMethodArgumentResolver() {
            @Override public boolean supportsParameter(MethodParameter p) {
                return p.hasParameterAnnotation(AuthenticationPrincipal.class);
            }
            @Override public Object resolveArgument(MethodParameter p, ModelAndViewContainer mav,
                                                    NativeWebRequest req, WebDataBinderFactory bf) {
                return user;
            }
        };
    }
}
