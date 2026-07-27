package com.cognizant.agrilink.notification.entity;

import com.cognizant.agrilink.notification.enums.NotificationStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "notification")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "notificationId")
	private Integer notificationId;

	@Column(name = "userId")
	private Integer userId;

	@Column(name = "message")
	private String message;

	@Column(name = "category")
	private String category;

	@Enumerated(EnumType.STRING)
	@Column(name = "status")
	private NotificationStatus status;

	@Column(name = "createdDate")
	private LocalDate createdDate;
}
