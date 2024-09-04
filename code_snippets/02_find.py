# Written by Clean Coder CoPilot (ChatGPT), prompted by Achim Mertens
def find_position(findMe, amount):
    left = 0
    right = amount
    steps = 0  # Counter to count the number of steps taken

    while left <= right:
        steps += 1
        mid = (left + right) // 2

        if mid == findMe:
            return mid, steps
        elif mid < findMe:
            left = mid + 1
        else:
            right = mid - 1

    return -1, steps  # Return -1 if the number is not found

findMe = 500000002
amount = 1000000000

position, steps = find_position(findMe, amount)
print(f"Die Zahl {findMe} liegt an der Position {position} und wurde in {steps} Schritten gefunden.")
