package com.cognizant.agrilink.notification.dto;

import com.cognizant.agrilink.notification.enums.NotificationCategory;
import com.cognizant.agrilink.notification.enums.NotificationStatus;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDto {

	private Integer notificationId;
	private Integer userId;
	private String message;
	private NotificationCategory category;
	private NotificationStatus status;
	private LocalDate createdDate;
}
