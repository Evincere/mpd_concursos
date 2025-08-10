import bcrypt

password = "IR0lFRknoz"
# Generar hash bcrypt compatible con Spring Security
hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(rounds=10))
print(hashed.decode('utf-8'))
