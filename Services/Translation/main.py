import sys
from deep_translator import (GoogleTranslator,DeepL,MyMemoryTranslator)
from textblob import TextBlob


def main():
    text = " ".join(sys.argv[1:])

    try:
        translated = GoogleTranslator(source='auto', target='en').translate(text)
        translated = TextBlob(translated).correct()
    except:
        translated = MyMemoryTranslator(source='auto', target='en').translate(text)
        translated = TextBlob(translated).correct()
    # return str(translated)
    print(translated)
    return 0
    exit()

if __name__ == "__main__":
    main()