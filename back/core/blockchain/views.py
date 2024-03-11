import json
import os
from django.http import HttpResponse
from django.views import View
from rest_framework.response import Response
from rest_framework import generics, status
from django.http import JsonResponse
from web3 import Web3

from core import settings

# Expected imput
# tournament_obj = {
#     "tournamentId": 0,
#     "players": ["Player1", "Player2"],
#     "matches": [
#         {"id": 1, "playerIds": [1, 2], "score": [0, 0], "date": 1638316800},
#         {"id": 2, "playerIds": [3, 4], "score": [0, 0], "date": 1638403200}
#     ]
# }

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
    def _add_tournament(tournament):
        contract = ContractView._get_contract()
        sender_address = ContractView.w3.eth.accounts[0]
        try:
            tx_hash = contract.functions.addTournament(tournament).transact({'from': sender_address})
            ContractView.w3.eth.wait_for_transaction_receipt(tx_hash)
            logger.warning(contract.functions.getTournaments().call())
        except Exception as e:
            logger.error(f"Error adding tournament: {e}")

    def post(self, request, *args, **kwargs):
        try:
            json_string = request.body.decode('utf-8').split("&")[0]
            json_string = json_string.strip("b'\"").replace("\\", "")
            tournament_dict = json.loads(json_string)
            self._add_tournament(tournament_dict)
            return HttpResponse('')
        except Exception as e:
            logger.error(f"Error processing POST request: {e}")
            return HttpResponse(status=500)

class ContractGetView(generics.GenericAPIView):

    def _get_tournaments(self):
        contract = ContractView._get_contract()
        try:
            tournaments = contract.functions.getTournaments().call()
            return tournaments
        except Exception as e:
            logger.error(f"Error getting tournaments: {e}")
            return []

    def get(self, request, *args, **kwargs):
        try:
            tournaments = self._get_tournaments()
            return JsonResponse({'tournaments': tournaments})
        except Exception as e:
            logger.error(f"Error processing GET request: {e}")
            return JsonResponse({'error': 'Internal Server Error'}, status=500)