# This image is created to prepare some things 
# like data views on kibana, that only are configurable via API
# and we need the container ready to create this

# se actulizará la contraseña de kibana_system
# se crearán los data views en la api de Kibana
# se crearán las políticas de permanencia de datos
FROM debian:bullseye-slim

COPY . .
RUN apt-get update && \
    apt-get install -y curl

RUN chmod +x script.sh
CMD ["./script.sh"]