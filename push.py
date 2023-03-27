import os

try:
  os.system('git add .')
  os.system('git commit -am "updated"')
  os.system('git push')
except Exception as err:
  print('ERROR:\n', err)

input('\n\nPress ENTER to continue...')