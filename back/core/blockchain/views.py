import json
import os
from django.http import HttpResponse
from django.views import View
from rest_framework.response import Response
from rest_framework import generics, status
from django.http import JsonResponse
from .models import Participant
from web3 import Web3

from core import settings

import logging
logger = logging.getLogger(__name__)

class ContractView(generics.GenericAPIView):

    w3 = Web3(Web3.HTTPProvider('http://ganache:8545'))

    @staticmethod
    def _get_contract():
        contract_file_path = "./contract/build/contracts/Transcendencechads.json"
        with open(contract_file_path, encoding='utf-8') as deploy_file:
            contract_json = json.load(deploy_file)
            contract_abi = contract_json.get("abi", [])
            for network in contract_json["networks"]:
                contract_address = contract_json["networks"][network]["address"]
            # contract_address = contract_json["networks"]["5777"]["address"]
            contract = ContractView.w3.eth.contract(address=contract_address, abi=contract_abi)
            return contract

class ContractPutView(generics.GenericAPIView):

    @staticmethod
    async def _add_tournament(tournament_id, rounds):
        contract = ContractView._get_contract()
        sender_address = ContractView.w3.eth.accounts[0]
        try:
            # logger.warning(f"{rounds}")
            json_rounds = json.dumps(rounds)
            tx_hash = contract.functions.addTournament(tournament_id, json_rounds).transact({'from': sender_address})
            ContractView.w3.eth.wait_for_transaction_receipt(tx_hash)
            # logger.warning(contract.functions.getTournament(tournament_id).call())
        except Exception as e:
            logger.error(f"Error adding tournament: {e}")

class ContractGetTableView(generics.GenericAPIView):

    def _get_tournament(self, tournament_id):
        contract = ContractView._get_contract()
        try:
            tournament_json = contract.functions.getTournament(tournament_id).call()
            tournament = json.loads(tournament_json)
            return tournament
        except Exception as e:
            # logger.error(f"Error getting tournament: {e}")
            return []

    def get(self, request):
        try:
            tournament_id = request.GET.get('tournament_id')
            tournament = self._get_tournament(tournament_id)
            return JsonResponse({'tournament': tournament})
        except Exception as e:
            return JsonResponse({}, status=204)
        
class ContractGetListView(generics.GenericAPIView):

    def get(self, request, user_id):
        try:
            if user_id is None:
                user_id = request.user.id
            tournaments_participated = Participant.get_tournaments_by_participant(user_id)
            return JsonResponse({'tournaments_participated': tournaments_participated})
        except Exception as e:
            # logger.error(f"Error processing GET request: {e}")
            return JsonResponse({}, status=204)