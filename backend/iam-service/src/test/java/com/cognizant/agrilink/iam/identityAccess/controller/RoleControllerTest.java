package com.cognizant.agrilink.iam.identityAccess.controller;

import com.cognizant.agrilink.iam.exception.GlobalExceptionHandler;
import com.cognizant.agrilink.iam.exception.ResourceNotFoundException;
import com.cognizant.agrilink.iam.identityAccess.dto.RoleResponseDto;
import com.cognizant.agrilink.iam.identityAccess.service.RoleService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class RoleControllerTest {

    private RoleService roleService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        roleService = mock(RoleService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new RoleController(roleService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    private RoleResponseDto sampleRole() {
        return RoleResponseDto.builder()
                .roleId(7).roleName("Auditor").description("desc").status("A").build();
    }

    // ── createRole ───────────────────────────────────────────────────────────
    @Test
    void createRole_valid_returns201() throws Exception {
        when(roleService.createRole(any())).thenReturn(sampleRole());

        mockMvc.perform(post("/agriLink/role/createRole")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"roleName\":\"Auditor\",\"description\":\"desc\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Role created successfully"))
                .andExpect(jsonPath("$.data").doesNotExist());
    }

    @Test
    void createRole_blankName_returns400() throws Exception {
        mockMvc.perform(post("/agriLink/role/createRole")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"description\":\"no name\"}"))
                .andExpect(status().isBadRequest());
        verify(roleService, never()).createRole(any());
    }

    @Test
    void createRole_duplicate_returns409() throws Exception {
        when(roleService.createRole(any()))
                .thenThrow(new IllegalStateException("Role already exists: Auditor"));

        mockMvc.perform(post("/agriLink/role/createRole")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"roleName\":\"Auditor\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Role already exists: Auditor"));
    }

    // ── read ───────────────────────────────────────────────────────────────
    @Test
    void getAllRoles_returns200() throws Exception {
        when(roleService.getAllRoles()).thenReturn(List.of(sampleRole()));

        mockMvc.perform(get("/agriLink/role"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].roleName").value("Auditor"));
    }

    @Test
    void getRole_returns200() throws Exception {
        when(roleService.getRole(7)).thenReturn(sampleRole());

        mockMvc.perform(get("/agriLink/role/7"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roleId").value(7));
    }

    @Test
    void getRole_notFound_returns404() throws Exception {
        when(roleService.getRole(99)).thenThrow(new ResourceNotFoundException("Role not found with id: 99"));

        mockMvc.perform(get("/agriLink/role/99"))
                .andExpect(status().isNotFound());
    }

    // ── update ───────────────────────────────────────────────────────────────
    @Test
    void updateRole_returns200() throws Exception {
        when(roleService.updateRole(eq(7), any())).thenReturn(sampleRole());

        mockMvc.perform(put("/agriLink/role/7")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"description\":\"new\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Role updated successfully"));
    }

    @Test
    void updateRole_invalidStatus_returns400() throws Exception {
        mockMvc.perform(put("/agriLink/role/7")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"X\"}"))
                .andExpect(status().isBadRequest());
        verify(roleService, never()).updateRole(any(), any());
    }

    // ── delete ───────────────────────────────────────────────────────────────
    @Test
    void deleteRole_returns200() throws Exception {
        mockMvc.perform(delete("/agriLink/role/7"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Role deleted successfully"));
        verify(roleService).deleteRole(7);
    }

    @Test
    void deleteRole_inUse_returns409() throws Exception {
        doThrow(new IllegalStateException("Role is assigned to one or more users and cannot be deleted"))
                .when(roleService).deleteRole(6);

        mockMvc.perform(delete("/agriLink/role/6"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message")
                        .value("Role is assigned to one or more users and cannot be deleted"));
    }
}
