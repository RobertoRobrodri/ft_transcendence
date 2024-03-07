FROM postgres:16-bullseye

# In case we need to add any special config, if not run postgres image directly in compose
RUN mkdir /log && \
    chown -R postgres:postgres /log && \
    chmod 0700 /log
COPY postgresql.conf /etc/postgresql/postgresql.conf
#COPY ./conf/override.conf /etc/systemd/system/postgresql.service.d/override.conf

#RUN sed -i 's/\*/django/g' /var/lib/postgresql/data/postgresql.conf