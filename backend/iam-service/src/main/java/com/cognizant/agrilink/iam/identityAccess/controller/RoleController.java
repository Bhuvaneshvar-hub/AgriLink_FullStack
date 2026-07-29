package com.cognizant.agrilink.iam.identityAccess.controller;

import com.cognizant.agrilink.iam.identityAccess.dto.CreateRoleRequestDto;
import com.cognizant.agrilink.iam.identityAccess.dto.RoleResponseDto;
import com.cognizant.agrilink.iam.identityAccess.dto.UpdateRoleRequestDto;
import com.cognizant.agrilink.iam.identityAccess.service.RoleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/agriLink/role")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;

    // POST /agriLink/role/createRole
    // Admin only — secured in SecurityConfig
    @PostMapping("/createRole")
    public ResponseEntity<Map<String, String>> createRole(@Valid @RequestBody CreateRoleRequestDto dto) {
        roleService.createRole(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Role created successfully"));
    }

    // GET /agriLink/role  — list all roles
    @GetMapping
    public ResponseEntity<List<RoleResponseDto>> getAllRoles() {
        return ResponseEntity.ok(roleService.getAllRoles());
    }

    // GET /agriLink/role/{id}  — get one role
    @GetMapping("/{id}")
    public ResponseEntity<RoleResponseDto> getRole(@PathVariable Integer id) {
        return ResponseEntity.ok(roleService.getRole(id));
    }

    // PUT /agriLink/role/{id}  — update a role
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, String>> updateRole(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateRoleRequestDto dto) {
        roleService.updateRole(id, dto);
        return ResponseEntity.ok(Map.of("message", "Role updated successfully"));
    }

    // DELETE /agriLink/role/{id}  — hard delete (blocked if users are assigned)
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteRole(@PathVariable Integer id) {
        roleService.deleteRole(id);
        return ResponseEntity.ok(Map.of("message", "Role deleted successfully"));
    }
}
