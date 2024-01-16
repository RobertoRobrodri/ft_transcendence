# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: guilmira <guilmira@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/01/16 07:24:58 by guilmira          #+#    #+#              #
#    Updated: 2024/01/16 07:37:02 by guilmira         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

NAME		= transcendence
#--------------------------------------------------------------------------------------------------------------PATHS
COMPOSE-PATH	= ./srcs
#--------------------------------------------------------------------------------------------------------------SOURCES
NAME-BACK	= back
NAME-DB		= db
NAME-FRONT	= front
#--------------------------------------------------------------------------------------------------------------RULES
$(NAME):
	docker compose up --detach
	@echo $(GREEN) "$(NAME) running. Containers up." $(NONE)

all: $(NAME)

git:
	git add .
	git commit -m "standard commit"
	git push

logs:
	docker logs $(NAME-FRONT)
	docker logs $(NAME-DB)
	docker logs $(NAME-BACK)

clean:
	docker compose kill
	docker container prune --force

fclean: clean
	@$(REMOVE)
	docker rmi $$(docker image ls -a -q)

kill:
	docker compose kill

re:
	docker compose down -v && docker compose build && docker compose up -d

.PHONY: all exe kill clean fclean re
#--------------------------------------------------------------------------------------------------------------FORMAT
NONE='\033[0m'
GREEN='\033[1;32m'