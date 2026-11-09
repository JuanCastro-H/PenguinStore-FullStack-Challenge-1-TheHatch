dic = {"q":"┤", "w":"╡", "e":"╢", "r":"╖", "t":"╕", "y":"╣", "u":"║", "i":"╗", "o":"╝", "p":"╜", 
"a":"╛", "s":"┐" , "d":"└", "f":"┴" , "g":"┬" , "h":"├" , "j":"─" , "k":"┼", "l":"╞" , "ñ":"╟",
"z":"╚", "x":"╔", "c":"╩", "v":"╦", "b":"╠", "n":"═", "m":"╬"}

msg = input()

def traducido():

    fmsg = ""
    for i in msg:

        # --- Verificar Mayuscula True/False ---
        mayuscula = i.isupper()

        i.lower()

        if i in dic and mayuscula:
            fmsg = fmsg + dic[i].upper() 
        if i in dic:
            fmsg = fmsg + dic[i]
        else:
            fmsg = fmsg + i
    print(fmsg)

traducido()