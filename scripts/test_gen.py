
import json, os, sys

def esc(s):
    return s.replace(chr(92), chr(92)*2).replace(chr(39), chr(39)*2)

parts = []

# Helper to add a part
def add(s):
    parts.append(s)

# Part 1 - already done, but we'll regenerate
add(