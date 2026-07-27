package com.cognizant.agrilink.iam.identityAccess.service;

import com.cognizant.agrilink.iam.exception.ForbiddenException;
import com.cognizant.agrilink.iam.exception.ResourceNotFoundException;
import com.cognizant.agrilink.iam.identityAccess.dto.ChangePasswordRequestDto;
import com.cognizant.agrilink.iam.identityAccess.dto.CreateUserRequestDto;
import com.cognizant.agrilink.iam.identityAccess.dto.LoginRequestDto;
import com.cognizant.agrilink.iam.identityAccess.dto.LoginResponseDto;
import com.cognizant.agrilink.iam.identityAccess.dto.RegisterRequestDto;
import com.cognizant.agrilink.iam.identityAccess.dto.ResetPasswordRequestDto;
import com.cognizant.agrilink.iam.identityAccess.dto.UpdateUserRequestDto;
import com.cognizant.agrilink.iam.identityAccess.dto.UserResponseDto;
import com.cognizant.agrilink.iam.identityAccess.model.UserDetails;
import com.cognizant.agrilink.iam.identityAccess.model.UserRole;
import com.cognizant.agrilink.iam.identityAccess.model.UserSession;
import com.cognizant.agrilink.iam.identityAccess.repository.AuditLogRepository;
import com.cognizant.agrilink.iam.identityAccess.repository.UserDetailsRepository;
import com.cognizant.agrilink.iam.identityAccess.repository.UserRoleRepository;
import com.cognizant.agrilink.iam.identityAccess.repository.UserSessionRepository;
import com.cognizant.agrilink.iam.security.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock private UserDetailsRepository userDetailsRepository;
    @Mock private UserRoleRepository    userRoleRepository;
    @Mock private UserSessionRepository userSessionRepository;
    @Mock private AuditLogRepository    auditLogRepository;
    @Mock private PasswordEncoder       passwordEncoder;
    @Mock private JwtUtil               jwtUtil;
    @Mock private HttpServletRequest    request;

    @InjectMocks private UserService userService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(userService, "accessTokenExpiryMs", 900_000L);
        ReflectionTestUtils.setField(userService, "refreshTokenExpiryMs", 604_800_000L);
    }

    // ── helpers ─────────────────────────────────────────────────────────────
    private UserRole role(int id, String name, UserRole.Status status) {
        return UserRole.builder().roleId(id).roleName(name).status(status).build();
    }

    private UserDetails user(int id, String email, UserRole role, UserDetails.Status status) {
        return UserDetails.builder()
                .userId(id).name("Test User").email(email).phone("9876543210")
                .passwordHash("hash").regionId(5).role(role).status(status)
                .createdAt(LocalDateTime.now()).build();
    }

    private CreateUserRequestDto createDto(int roleId, String email) {
        CreateUserRequestDto dto = new CreateUserRequestDto();
        dto.setRoleId(roleId);
        dto.setName("New User");
        dto.setEmail(email);
        dto.setPassword("Secret@123");
        dto.setPhone("9000000000");
        dto.setRegionId(7);
        return dto;
    }

    private RegisterRequestDto registerDto(String email) {
        RegisterRequestDto dto = new RegisterRequestDto();
        dto.setName("New Farmer");
        dto.setEmail(email);
        dto.setPassword("Secret@123");
        dto.setPhone("9000000000");
        dto.setRegionId(7);
        return dto;
    }

    private LoginRequestDto loginDto(String email, String pw) {
        LoginRequestDto dto = new LoginRequestDto();
        dto.setEmail(email);
        dto.setPassword(pw);
        return dto;
    }

    private UserSession session(UserSession.Status status, LocalDateTime expiresAt) {
        return UserSession.builder()
                .sessionId(10)
                .user(user(1, "admin@a.com", adminRole, UserDetails.Status.A))
                .refreshTokenHash("oldhash")
                .refreshTokenExpiresAt(expiresAt)
                .status(status)
                .build();
    }

    private final UserRole adminRole  = role(1, "AgriLinkAdmin", UserRole.Status.A);
    private final UserRole farmerRole = role(6, "Farmer", UserRole.Status.A);

    // ════════════════════════════════ createUser ════════════════════════════
    @Test
    @DisplayName("createUser: admin creates user successfully")
    void createUser_success() {
        UserDetails admin = user(1, "admin@a.com", adminRole, UserDetails.Status.A);
        when(userDetailsRepository.existsByEmail("new@a.com")).thenReturn(false);
        when(userRoleRepository.findById(6)).thenReturn(Optional.of(farmerRole));
        when(passwordEncoder.encode("Secret@123")).thenReturn("encoded");

        UserResponseDto res = userService.createUser(createDto(6, "new@a.com"), admin);

        assertEquals("new@a.com", res.getEmail());
        assertEquals("Farmer", res.getRoleName());
        assertEquals("A", res.getStatus());
        verify(userDetailsRepository).save(any(UserDetails.class));
    }

    @Test
    @DisplayName("createUser: duplicate email -> IllegalStateException")
    void createUser_duplicateEmail() {
        UserDetails admin = user(1, "admin@a.com", adminRole, UserDetails.Status.A);
        when(userDetailsRepository.existsByEmail("dup@a.com")).thenReturn(true);

        assertThrows(IllegalStateException.class,
                () -> userService.createUser(createDto(6, "dup@a.com"), admin));
        verify(userDetailsRepository, never()).save(any());
    }

    @Test
    @DisplayName("createUser: role not found -> ResourceNotFoundException")
    void createUser_roleNotFound() {
        UserDetails admin = user(1, "admin@a.com", adminRole, UserDetails.Status.A);
        when(userDetailsRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRoleRepository.findById(99)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> userService.createUser(createDto(99, "x@a.com"), admin));
    }

    @Test
    @DisplayName("createUser: inactive role -> IllegalStateException")
    void createUser_inactiveRole() {
        UserDetails admin = user(1, "admin@a.com", adminRole, UserDetails.Status.A);
        UserRole inactive = role(6, "Farmer", UserRole.Status.I);
        when(userDetailsRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRoleRepository.findById(6)).thenReturn(Optional.of(inactive));

        assertThrows(IllegalStateException.class,
                () -> userService.createUser(createDto(6, "x@a.com"), admin));
    }

    @Test
    @DisplayName("createUser: ExtensionOfficer creates Farmer -> success")
    void createUser_officerCreatesFarmer() {
        UserDetails officer = user(2, "off@a.com",
                role(2, "ExtensionOfficer", UserRole.Status.A), UserDetails.Status.A);
        when(userDetailsRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRoleRepository.findById(6)).thenReturn(Optional.of(farmerRole));
        when(passwordEncoder.encode(anyString())).thenReturn("encoded");

        UserResponseDto res = userService.createUser(createDto(6, "farmer@a.com"), officer);

        assertEquals("Farmer", res.getRoleName());
        verify(userDetailsRepository).save(any());
    }

    @Test
    @DisplayName("createUser: ExtensionOfficer creates non-Farmer -> ForbiddenException")
    void createUser_officerCreatesNonFarmer() {
        UserDetails officer = user(2, "off@a.com",
                role(2, "ExtensionOfficer", UserRole.Status.A), UserDetails.Status.A);
        when(userDetailsRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRoleRepository.findById(4)).thenReturn(
                Optional.of(role(4, "SubsidyAdmin", UserRole.Status.A)));

        assertThrows(ForbiddenException.class,
                () -> userService.createUser(createDto(4, "sa@a.com"), officer));
        verify(userDetailsRepository, never()).save(any());
    }

    @Test
    @DisplayName("createUser: admin can create a non-Farmer role")
    void createUser_adminCreatesOfficer() {
        UserDetails admin = user(1, "admin@a.com", adminRole, UserDetails.Status.A);
        when(userDetailsRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRoleRepository.findById(4)).thenReturn(
                Optional.of(role(4, "SubsidyAdmin", UserRole.Status.A)));
        when(passwordEncoder.encode(anyString())).thenReturn("encoded");

        UserResponseDto res = userService.createUser(createDto(4, "sa@a.com"), admin);

        assertEquals("SubsidyAdmin", res.getRoleName());
    }

    @Test
    @DisplayName("createUser: password is encoded, never stored raw")
    void createUser_encodesPassword() {
        UserDetails admin = user(1, "admin@a.com", adminRole, UserDetails.Status.A);
        when(userDetailsRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRoleRepository.findById(6)).thenReturn(Optional.of(farmerRole));
        when(passwordEncoder.encode("Secret@123")).thenReturn("encoded-hash");

        userService.createUser(createDto(6, "p@a.com"), admin);

        ArgumentCaptor<UserDetails> cap = ArgumentCaptor.forClass(UserDetails.class);
        verify(userDetailsRepository).save(cap.capture());
        assertEquals("encoded-hash", cap.getValue().getPasswordHash());
        assertNotEquals("Secret@123", cap.getValue().getPasswordHash());
    }

    @Test
    @DisplayName("createUser: new user is created Active")
    void createUser_newUserIsActive() {
        UserDetails admin = user(1, "admin@a.com", adminRole, UserDetails.Status.A);
        when(userDetailsRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRoleRepository.findById(6)).thenReturn(Optional.of(farmerRole));
        when(passwordEncoder.encode(anyString())).thenReturn("encoded");

        ArgumentCaptor<UserDetails> cap = ArgumentCaptor.forClass(UserDetails.class);
        userService.createUser(createDto(6, "a@a.com"), admin);
        verify(userDetailsRepository).save(cap.capture());
        assertEquals(UserDetails.Status.A, cap.getValue().getStatus());
    }

    // ════════════════════════════════ register ═══════════════════════════════
    @Test
    @DisplayName("register: farmer self-registration creates Pending user")
    void register_success_pending() {
        when(userDetailsRepository.existsByEmail("farm@a.com")).thenReturn(false);
        when(userRoleRepository.findByRoleName("Farmer")).thenReturn(Optional.of(farmerRole));
        when(passwordEncoder.encode("Secret@123")).thenReturn("encoded");

        UserResponseDto res = userService.register(registerDto("farm@a.com"), request);

        assertEquals("farm@a.com", res.getEmail());
        assertEquals("Farmer", res.getRoleName());
        assertEquals("P", res.getStatus());

        ArgumentCaptor<UserDetails> cap = ArgumentCaptor.forClass(UserDetails.class);
        verify(userDetailsRepository).save(cap.capture());
        assertEquals(UserDetails.Status.P, cap.getValue().getStatus());
    }

    @Test
    @DisplayName("register: duplicate email -> IllegalStateException")
    void register_duplicateEmail() {
        when(userDetailsRepository.existsByEmail("dup@a.com")).thenReturn(true);
        assertThrows(IllegalStateException.class,
                () -> userService.register(registerDto("dup@a.com"), request));
        verify(userDetailsRepository, never()).save(any());
    }

    @Test
    @DisplayName("register: Farmer role missing -> ResourceNotFoundException")
    void register_farmerRoleMissing() {
        when(userDetailsRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRoleRepository.findByRoleName("Farmer")).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class,
                () -> userService.register(registerDto("x@a.com"), request));
    }

    // ════════════════════════════════ approveUser ════════════════════════════
    @Test
    @DisplayName("approveUser: Pending -> Active")
    void approveUser_success() {
        UserDetails approver = user(1, "admin@a.com", adminRole, UserDetails.Status.A);
        UserDetails pending = user(5, "p@a.com", farmerRole, UserDetails.Status.P);
        when(userDetailsRepository.findById(5)).thenReturn(Optional.of(pending));

        UserResponseDto res = userService.approveUser(5, approver);

        assertEquals("A", res.getStatus());
        assertEquals(UserDetails.Status.A, pending.getStatus());
        verify(userDetailsRepository).save(pending);
    }

    @Test
    @DisplayName("approveUser: already active -> IllegalStateException")
    void approveUser_alreadyActive() {
        UserDetails approver = user(1, "admin@a.com", adminRole, UserDetails.Status.A);
        UserDetails active = user(5, "p@a.com", farmerRole, UserDetails.Status.A);
        when(userDetailsRepository.findById(5)).thenReturn(Optional.of(active));

        assertThrows(IllegalStateException.class, () -> userService.approveUser(5, approver));
        verify(userDetailsRepository, never()).save(any());
    }

    @Test
    @DisplayName("approveUser: not found -> ResourceNotFoundException")
    void approveUser_notFound() {
        UserDetails approver = user(1, "admin@a.com", adminRole, UserDetails.Status.A);
        when(userDetailsRepository.findById(99)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> userService.approveUser(99, approver));
    }

    // ════════════════════════════════ getUser / list ═════════════════════════
    @Test
    void getUser_success() {
        UserDetails u = user(3, "u@a.com", farmerRole, UserDetails.Status.A);
        when(userDetailsRepository.findById(3)).thenReturn(Optional.of(u));

        UserResponseDto res = userService.getUser(3);

        assertEquals(3, res.getUserId());
        assertEquals("u@a.com", res.getEmail());
    }

    @Test
    void getUser_notFound() {
        when(userDetailsRepository.findById(99)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> userService.getUser(99));
    }

    @Test
    void getAllUsers_returnsMappedList() {
        when(userDetailsRepository.findAll()).thenReturn(List.of(
                user(1, "a@a.com", adminRole, UserDetails.Status.A),
                user(2, "b@a.com", farmerRole, UserDetails.Status.A)));

        List<UserResponseDto> res = userService.getAllUsers();

        assertEquals(2, res.size());
        assertEquals("a@a.com", res.get(0).getEmail());
    }

    @Test
    void getAllUsers_empty() {
        when(userDetailsRepository.findAll()).thenReturn(List.of());
        assertTrue(userService.getAllUsers().isEmpty());
    }

    // ════════════════════════════════ updateUser ═════════════════════════════
    @Test
    void updateUser_name() {
        UserDetails u = user(3, "u@a.com", farmerRole, UserDetails.Status.A);
        when(userDetailsRepository.findById(3)).thenReturn(Optional.of(u));
        UpdateUserRequestDto d = new UpdateUserRequestDto(); d.setName("Renamed");

        userService.updateUser(3, d);

        assertEquals("Renamed", u.getName());
        verify(userDetailsRepository).save(u);
    }

    @Test
    void updateUser_phone() {
        UserDetails u = user(3, "u@a.com", farmerRole, UserDetails.Status.A);
        when(userDetailsRepository.findById(3)).thenReturn(Optional.of(u));
        UpdateUserRequestDto d = new UpdateUserRequestDto(); d.setPhone("1112223333");

        userService.updateUser(3, d);
        assertEquals("1112223333", u.getPhone());
    }

    @Test
    void updateUser_regionId() {
        UserDetails u = user(3, "u@a.com", farmerRole, UserDetails.Status.A);
        when(userDetailsRepository.findById(3)).thenReturn(Optional.of(u));
        UpdateUserRequestDto d = new UpdateUserRequestDto(); d.setRegionId(42);

        userService.updateUser(3, d);
        assertEquals(42, u.getRegionId());
    }

    @Test
    void updateUser_statusToSuspended() {
        UserDetails u = user(3, "u@a.com", farmerRole, UserDetails.Status.A);
        when(userDetailsRepository.findById(3)).thenReturn(Optional.of(u));
        UpdateUserRequestDto d = new UpdateUserRequestDto(); d.setStatus("S");

        userService.updateUser(3, d);
        assertEquals(UserDetails.Status.S, u.getStatus());
    }

    @Test
    void updateUser_role_success() {
        UserDetails u = user(3, "u@a.com", farmerRole, UserDetails.Status.A);
        when(userDetailsRepository.findById(3)).thenReturn(Optional.of(u));
        when(userRoleRepository.findById(1)).thenReturn(Optional.of(adminRole));
        UpdateUserRequestDto d = new UpdateUserRequestDto(); d.setRoleId(1);

        userService.updateUser(3, d);
        assertEquals("AgriLinkAdmin", u.getRole().getRoleName());
    }

    @Test
    void updateUser_role_notFound() {
        UserDetails u = user(3, "u@a.com", farmerRole, UserDetails.Status.A);
        when(userDetailsRepository.findById(3)).thenReturn(Optional.of(u));
        when(userRoleRepository.findById(99)).thenReturn(Optional.empty());
        UpdateUserRequestDto d = new UpdateUserRequestDto(); d.setRoleId(99);

        assertThrows(ResourceNotFoundException.class, () -> userService.updateUser(3, d));
    }

    @Test
    void updateUser_role_inactive() {
        UserDetails u = user(3, "u@a.com", farmerRole, UserDetails.Status.A);
        when(userDetailsRepository.findById(3)).thenReturn(Optional.of(u));
        when(userRoleRepository.findById(2)).thenReturn(
                Optional.of(role(2, "ExtensionOfficer", UserRole.Status.I)));
        UpdateUserRequestDto d = new UpdateUserRequestDto(); d.setRoleId(2);

        assertThrows(IllegalStateException.class, () -> userService.updateUser(3, d));
    }

    @Test
    void updateUser_userNotFound() {
        when(userDetailsRepository.findById(99)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class,
                () -> userService.updateUser(99, new UpdateUserRequestDto()));
    }

    @Test
    void updateUser_blankNameIsIgnored() {
        UserDetails u = user(3, "u@a.com", farmerRole, UserDetails.Status.A);
        when(userDetailsRepository.findById(3)).thenReturn(Optional.of(u));
        UpdateUserRequestDto d = new UpdateUserRequestDto(); d.setName("   ");

        userService.updateUser(3, d);
        assertEquals("Test User", u.getName());  // unchanged
    }

    @Test
    void updateUser_nullFieldsLeaveValuesUnchanged() {
        UserDetails u = user(3, "u@a.com", farmerRole, UserDetails.Status.A);
        when(userDetailsRepository.findById(3)).thenReturn(Optional.of(u));

        userService.updateUser(3, new UpdateUserRequestDto());  // all-null dto

        assertEquals("Test User", u.getName());
        assertEquals("9876543210", u.getPhone());
        assertEquals(5, u.getRegionId());
        assertEquals(UserDetails.Status.A, u.getStatus());
    }

    // ════════════════════════════════ deleteUser ═════════════════════════════
    @Test
    void deleteUser_softDeletesAndRevokesSessions() {
        UserDetails u = user(3, "u@a.com", farmerRole, UserDetails.Status.A);
        when(userDetailsRepository.findById(3)).thenReturn(Optional.of(u));

        userService.deleteUser(3);

        assertEquals(UserDetails.Status.I, u.getStatus());
        verify(userDetailsRepository).save(u);
        verify(userSessionRepository).revokeAllActiveSessionsByUserId(3);
    }

    @Test
    void deleteUser_notFound() {
        when(userDetailsRepository.findById(99)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> userService.deleteUser(99));
        verify(userSessionRepository, never()).revokeAllActiveSessionsByUserId(any());
    }

    // ════════════════════════════════ login ══════════════════════════════════
    @Test
    void login_success() {
        UserDetails u = user(1, "admin@a.com", adminRole, UserDetails.Status.A);
        when(userDetailsRepository.findByEmail("admin@a.com")).thenReturn(Optional.of(u));
        when(passwordEncoder.matches("pw", "hash")).thenReturn(true);
        when(jwtUtil.generateAccessToken(u)).thenReturn("access-token");

        LoginResponseDto res = userService.login(loginDto("admin@a.com", "pw"), request);

        assertEquals("access-token", res.getAccessToken());
        assertNotNull(res.getRefreshToken());
        assertEquals(1, res.getUserId());
        assertEquals("AgriLinkAdmin", res.getRoleName());
        assertEquals(900, res.getExpiresIn());
        verify(userSessionRepository).save(any(UserSession.class));
    }

    @Test
    void login_invalidEmail() {
        when(userDetailsRepository.findByEmail("no@a.com")).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class,
                () -> userService.login(loginDto("no@a.com", "pw"), request));
    }

    @Test
    void login_wrongPassword() {
        UserDetails u = user(1, "admin@a.com", adminRole, UserDetails.Status.A);
        when(userDetailsRepository.findByEmail("admin@a.com")).thenReturn(Optional.of(u));
        when(passwordEncoder.matches("bad", "hash")).thenReturn(false);

        assertThrows(IllegalArgumentException.class,
                () -> userService.login(loginDto("admin@a.com", "bad"), request));
        verify(userSessionRepository, never()).save(any());
    }

    @Test
    void login_suspendedAccount() {
        UserDetails u = user(1, "s@a.com", adminRole, UserDetails.Status.S);
        when(userDetailsRepository.findByEmail("s@a.com")).thenReturn(Optional.of(u));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> userService.login(loginDto("s@a.com", "pw"), request));
        assertTrue(ex.getMessage().toLowerCase().contains("suspended"));
    }

    @Test
    void login_inactiveAccount() {
        UserDetails u = user(1, "i@a.com", adminRole, UserDetails.Status.I);
        when(userDetailsRepository.findByEmail("i@a.com")).thenReturn(Optional.of(u));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> userService.login(loginDto("i@a.com", "pw"), request));
        assertTrue(ex.getMessage().toLowerCase().contains("inactive"));
    }

    @Test
    void login_pendingAccount() {
        UserDetails u = user(1, "p@a.com", farmerRole, UserDetails.Status.P);
        when(userDetailsRepository.findByEmail("p@a.com")).thenReturn(Optional.of(u));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> userService.login(loginDto("p@a.com", "pw"), request));
        assertTrue(ex.getMessage().toLowerCase().contains("pending"));
        verify(userSessionRepository, never()).save(any());
    }

    @Test
    void login_persistsSessionWithHashedRefreshToken() {
        UserDetails u = user(1, "admin@a.com", adminRole, UserDetails.Status.A);
        when(userDetailsRepository.findByEmail("admin@a.com")).thenReturn(Optional.of(u));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);
        when(jwtUtil.generateAccessToken(u)).thenReturn("access-token");

        LoginResponseDto res = userService.login(loginDto("admin@a.com", "pw"), request);

        ArgumentCaptor<UserSession> cap = ArgumentCaptor.forClass(UserSession.class);
        verify(userSessionRepository).save(cap.capture());
        UserSession saved = cap.getValue();
        // stored hash must differ from the raw token returned to the client
        assertNotEquals(res.getRefreshToken(), saved.getRefreshTokenHash());
        assertEquals(UserSession.Status.Active, saved.getStatus());
    }

    // ════════════════════════════════ refreshToken ═══════════════════════════
    @Test
    void refresh_success_rotatesToken() {
        UserSession s = session(UserSession.Status.Active, LocalDateTime.now().plusDays(1));
        when(userSessionRepository.findByRefreshTokenHash(anyString())).thenReturn(Optional.of(s));
        when(jwtUtil.generateAccessToken(any())).thenReturn("new-access");

        LoginResponseDto res = userService.refreshToken("raw-token");

        assertEquals("new-access", res.getAccessToken());
        assertNotNull(res.getRefreshToken());
        assertNotEquals("oldhash", s.getRefreshTokenHash());      // rotated
        assertNotNull(s.getRefreshTokenRotatedAt());
        verify(userSessionRepository).save(s);
    }

    @Test
    void refresh_invalidToken() {
        when(userSessionRepository.findByRefreshTokenHash(anyString())).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> userService.refreshToken("bad"));
    }

    @Test
    void refresh_revokedSession() {
        UserSession s = session(UserSession.Status.Revoked, LocalDateTime.now().plusDays(1));
        when(userSessionRepository.findByRefreshTokenHash(anyString())).thenReturn(Optional.of(s));
        assertThrows(IllegalArgumentException.class, () -> userService.refreshToken("raw"));
    }

    @Test
    void refresh_expiredToken_marksExpired() {
        UserSession s = session(UserSession.Status.Active, LocalDateTime.now().minusDays(1));
        when(userSessionRepository.findByRefreshTokenHash(anyString())).thenReturn(Optional.of(s));

        assertThrows(IllegalArgumentException.class, () -> userService.refreshToken("raw"));
        assertEquals(UserSession.Status.Expired, s.getStatus());
        verify(userSessionRepository).save(s);
    }

    // ════════════════════════════════ logout ═════════════════════════════════
    @Test
    void logout_revokesAllActiveSessions() {
        userService.logout(7);
        verify(userSessionRepository).revokeAllActiveSessionsByUserId(eq(7));
    }

    // ════════════════════════════════ changePassword ═════════════════════════
    @Test
    void changePassword_success() {
        UserDetails u = user(3, "u@a.com", farmerRole, UserDetails.Status.A);
        when(userDetailsRepository.findById(3)).thenReturn(Optional.of(u));
        when(passwordEncoder.matches("old", "hash")).thenReturn(true);   // current matches
        when(passwordEncoder.matches("NewPass@123", "hash")).thenReturn(false); // new differs
        when(passwordEncoder.encode("NewPass@123")).thenReturn("new-hash");

        userService.changePassword(3, new ChangePasswordRequestDto("old", "NewPass@123"));

        assertEquals("new-hash", u.getPasswordHash());
        verify(userDetailsRepository).save(u);
        verify(userSessionRepository).revokeAllActiveSessionsByUserId(3);
    }

    @Test
    void changePassword_wrongCurrent_throws() {
        UserDetails u = user(3, "u@a.com", farmerRole, UserDetails.Status.A);
        when(userDetailsRepository.findById(3)).thenReturn(Optional.of(u));
        when(passwordEncoder.matches("bad", "hash")).thenReturn(false);

        assertThrows(IllegalArgumentException.class,
                () -> userService.changePassword(3, new ChangePasswordRequestDto("bad", "NewPass@123")));
        verify(userDetailsRepository, never()).save(any());
        verify(userSessionRepository, never()).revokeAllActiveSessionsByUserId(any());
    }

    @Test
    void changePassword_sameAsOld_throws() {
        UserDetails u = user(3, "u@a.com", farmerRole, UserDetails.Status.A);
        when(userDetailsRepository.findById(3)).thenReturn(Optional.of(u));
        // current matches AND new equals current (same value -> same stub)
        when(passwordEncoder.matches("old", "hash")).thenReturn(true);

        assertThrows(IllegalStateException.class,
                () -> userService.changePassword(3, new ChangePasswordRequestDto("old", "old")));
        verify(userDetailsRepository, never()).save(any());
    }

    @Test
    void changePassword_userNotFound_throws() {
        when(userDetailsRepository.findById(99)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class,
                () -> userService.changePassword(99, new ChangePasswordRequestDto("old", "NewPass@123")));
    }

    // ════════════════════════════════ resetPassword (admin) ══════════════════
    @Test
    void resetPassword_success() {
        UserDetails u = user(3, "u@a.com", farmerRole, UserDetails.Status.A);
        when(userDetailsRepository.findById(3)).thenReturn(Optional.of(u));
        when(passwordEncoder.encode("Temp@1234")).thenReturn("reset-hash");

        userService.resetPassword(3, new ResetPasswordRequestDto("Temp@1234"));

        assertEquals("reset-hash", u.getPasswordHash());
        verify(userDetailsRepository).save(u);
        verify(userSessionRepository).revokeAllActiveSessionsByUserId(3);
    }

    @Test
    void resetPassword_userNotFound_throws() {
        when(userDetailsRepository.findById(99)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class,
                () -> userService.resetPassword(99, new ResetPasswordRequestDto("Temp@1234")));
        verify(userSessionRepository, never()).revokeAllActiveSessionsByUserId(any());
    }
}
