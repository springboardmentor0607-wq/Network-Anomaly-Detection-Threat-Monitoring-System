def calculate_risk(severity):

    if severity == "Low":
        return 20

    elif severity == "Medium":
        return 60

    elif severity == "High":
        return 85

    elif severity == "Critical":
        return 100

    return 0