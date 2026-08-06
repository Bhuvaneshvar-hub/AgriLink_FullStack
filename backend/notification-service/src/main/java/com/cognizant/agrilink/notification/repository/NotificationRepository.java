package com.cognizant.agrilink.notification.repository;

import com.cognizant.agrilink.notification.entity.Notification;
import com.cognizant.agrilink.notification.enums.NotificationStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Integer> {

	List<Notification> findByUserId(Integer userId);

	List<Notification> findByUserIdAndStatus(Integer userId, NotificationStatus status);

	long countByUserIdAndStatus(Integer userId, NotificationStatus status);
}
