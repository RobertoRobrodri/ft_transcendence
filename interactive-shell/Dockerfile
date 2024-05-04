FROM alpine
RUN apk add --no-cache openssh

RUN ssh-keygen -A

ARG SSH_USER
ARG SSH_PASSWORD
ENV SSH_USER=${SSH_USER}
ENV SSH_PASSWORD=${SSH_PASSWORD}

RUN adduser -D $SSH_USER && echo "$SSH_USER:$SSH_PASSWORD" | chpasswd

EXPOSE 2222
CMD ["/usr/sbin/sshd", "-D"]