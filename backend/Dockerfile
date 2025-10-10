# Build stage
FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /app

# Copy dependency files first for better caching
COPY pom.xml .
RUN mvn -q -e -B -DskipTests dependency:go-offline

# Copy source code and build
COPY src ./src
RUN mvn -q -e -B -DskipTests clean package

# Development stage
FROM eclipse-temurin:17-jre-alpine AS development
WORKDIR /app
RUN addgroup -g 1001 -S spring && adduser -u 1001 -S spring -G spring
COPY --from=build /app/target/portfolio-backend-0.0.1-SNAPSHOT.jar app.jar
RUN chown spring:spring app.jar
USER spring:spring
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]

# Production stage
FROM eclipse-temurin:17-jre-alpine AS production
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup -g 1001 -S spring && adduser -u 1001 -S spring -G spring

# Copy the jar file
COPY --from=build /app/target/portfolio-backend-0.0.1-SNAPSHOT.jar app.jar
RUN chown spring:spring app.jar

# Switch to non-root user
USER spring:spring

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# Expose port
EXPOSE 8080

# JVM optimizations for production
ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC -XX:+UseStringDeduplication -XX:+OptimizeStringConcat -Djava.security.egd=file:/dev/./urandom"

# Run the application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
