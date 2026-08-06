package com.cognizant.agrilink.notification.entity;

import com.cognizant.agrilink.notification.converter.NotificationCategoryConverter;
import com.cognizant.agrilink.notification.enums.NotificationCategory;
import com.cognizant.agrilink.notification.enums.NotificationStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

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

	@Convert(converter = NotificationCategoryConverter.class)
	@Column(name = "category")
	private NotificationCategory category;

	// Stored as VARCHAR (not a native MySQL ENUM) so new NotificationStatus values can
	// be added without an ALTER — a native enum column would reject values added after
	// creation (this bit a Dismissed status before the column was widened).
	@Enumerated(EnumType.STRING)
	@JdbcTypeCode(SqlTypes.VARCHAR)
	@Column(name = "status")
	private NotificationStatus status;

	@Column(name = "createdDate")
	private LocalDate createdDate;
}
