# MobVibe Sandbox Docker Image
# Base: node:20-alpine (~50MB)
# Installed: Node.js 20 LTS, Expo CLI, EAS CLI, Git, Bash
# Security: Non-root user, minimal packages
# Target Size: ~150MB

FROM node:20-alpine

# Install system dependencies
# - bash: Shell operations
# - git: Version control
# - openssh-client: Git operations over SSH
RUN apk add --no-cache \
    bash \
    git \
    openssh-client

# Create non-root user
RUN addgroup -S appuser && adduser -S -G appuser appuser

# Create working directory
WORKDIR /workspace

# Install Expo CLI and EAS CLI globally
# Using --force flag to avoid peer dependency warnings
RUN npm install -g \
    @expo/cli \
    eas-cli \
    --force

# Set ownership of workspace
RUN chown -R appuser:appuser /workspace

# Switch to non-root user
USER appuser

# Set environment
ENV NODE_ENV=production
ENV HOME=/home/appuser

# Working directory for code execution
WORKDIR /workspace

# Default command (can be overridden by Fly.io)
CMD ["/bin/bash"]
