package com.cognizant.agrilink.input.audit;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Auto-audits write operations (POST/PUT/DELETE) on REST controllers by
 * reporting them to the centralized audit API in iam-service (via AuditClient).
 * No audit data is stored locally anymore.
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditLoggingAspect {

    private final AuditClient auditClient;
    private static final String MODULE = "INPUT";

    @Pointcut("within(@org.springframework.web.bind.annotation.RestController *)")
    public void controllerMethods() {}

    @Pointcut("@annotation(org.springframework.web.bind.annotation.PostMapping) || " +
              "@annotation(org.springframework.web.bind.annotation.PutMapping) || " +
              "@annotation(org.springframework.web.bind.annotation.DeleteMapping)")
    public void writeOperations() {}

    @AfterReturning(pointcut = "controllerMethods() && writeOperations()", returning = "result")
    public void auditLog(JoinPoint joinPoint, Object result) {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes == null) return;
            HttpServletRequest request = attributes.getRequest();

            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            Integer userId = null;
            if (auth != null && auth.getPrincipal() instanceof Integer) {
                userId = (Integer) auth.getPrincipal();
            }

            String httpMethod = request.getMethod();
            String className = joinPoint.getTarget().getClass().getSimpleName();
            String entityName = className.replace("Controller", "");
            String action = getActionName(httpMethod, entityName);
            String ipAddress = request.getRemoteAddr();
            String bearerToken = request.getHeader("Authorization");

            // Fire-and-forget to iam-service; never blocks or fails the request.
            auditClient.send(userId, action, MODULE, ipAddress, bearerToken);
        } catch (Exception e) {
            log.warn("Failed to enqueue audit log: {}", e.getMessage());
        }
    }

    private String getActionName(String httpMethod, String entityName) {
        switch (httpMethod.toUpperCase()) {
            case "POST": return "CREATE_" + entityName;
            case "PUT": return "UPDATE_" + entityName;
            case "DELETE": return "DELETE_" + entityName;
            default: return httpMethod + "_" + entityName;
        }
    }
}
