package com.cognizant.agrilink.notification.converter;

import com.cognizant.agrilink.notification.enums.NotificationCategory;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Persists {@link NotificationCategory} as its constant name, but tolerates
 * legacy / unknown values on read: instead of throwing (which would fail the
 * entire list query and 500 {@code GET /notifications}), an unrecognised
 * category is bucketed as {@link NotificationCategory#Compliance}.
 */
@Converter
public class NotificationCategoryConverter implements AttributeConverter<NotificationCategory, String> {

    @Override
    public String convertToDatabaseColumn(NotificationCategory attribute) {
        return attribute == null ? null : attribute.name();
    }

    @Override
    public NotificationCategory convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return null;
        }
        try {
            return NotificationCategory.valueOf(dbData);
        } catch (IllegalArgumentException e) {
            // Legacy / out-of-enum value (e.g. the old 'General') — keep the row
            // readable rather than breaking the whole notifications list.
            return NotificationCategory.Compliance;
        }
    }
}
