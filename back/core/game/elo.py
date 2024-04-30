# Adjustment factor
K = 32

def expected(elo_player_1, elo_player_2):
    return 1 / (1 + 10 ** ((elo_player_2 - elo_player_1) / 400))

def elo(pt, sa, exp):
	return (pt + K * (sa - exp))