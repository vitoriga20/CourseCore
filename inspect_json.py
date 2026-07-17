import json
p = r'c:\Users\vitoriga\AppData\Local\Temp\physics_questions\comprehensive_mixed.json'
data = json.loads(open(p, encoding='utf-8').read())
print('Total:', len(data))
for q in data[:3]:
    print('--- id', q['id'], q['category'], q['type'], '---')
    print(q['question'][:200])
    if q.get('options'):
        print('options:', [o[:80] for o in q['options']])
    print('answer:', q.get('answer'))
    print('image:', q.get