import os.path
cw_path = os.path.abspath(os.path.dirname(__file__))
import sys
import re
import string
from collections import Counter
import preprocessor.api as p
from deep_translator import (GoogleTranslator,DeepL,MyMemoryTranslator)
from textblob import TextBlob

from nltk.tokenize import word_tokenize 
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer


from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

import pandas as pd

def remove_punct(text):
    # Iterate for all non punctuation chars
    text = "".join([ char for char in text if char not in string.punctuation ])
    # Remove all numbers
    text = re.sub('[0-9]+', '', text)
    # Return text
    return text

def clean_text(text):
    # Clean links and hashtags
    p.clean(text)
    text = remove_punct(text).lower()
    return text

def translate_text(text):
    try:
        translated = GoogleTranslator(source='auto', target='en').translate(text)
        translated = TextBlob(translated).correct()
    except:
        translated = MyMemoryTranslator(source='auto', target='en').translate(text)
        translated = TextBlob(translated).correct()

    return str(translated)

def get_sentiment(text):
    analyzer = SentimentIntensityAnalyzer()
    vs = analyzer.polarity_scores(text)
    # polarity
    polarity = TextBlob(text).sentiment.polarity
    # subjectivity
    subjectivity = TextBlob(text).sentiment.subjectivity
    return [vs, polarity, subjectivity]

def get_emotions(text):
    # Using word_tokenize because it's faster than split()
    tokenized_words = word_tokenize(text)
    # Removing stop words
    final_words = [word for word in tokenized_words if word not in stopwords.words('english')]
    # Lemmatization - From plural to single + Base form of a word (example better-> good)
    lemma_words = [WordNetLemmatizer().lemmatize(word) for word in final_words]
    
    emotion_list = []
    
    emotions_file = os.path.join(cw_path, 'emotions.txt')
    with open(emotions_file, 'r') as file:
        for line in file:
            # Clean line
            clear_line = line.replace("\n", '').replace(",", '').replace("'", '').strip()
            # Get word and emotion
            word, emotion = clear_line.split(":")
            # Add to emotion
            if word in lemma_words:
                emotion_list.append(emotion)
    # Diccionario Sanford con mas capacidad
    filepath = "NRC-emotion-lexicon-wordlevel-alphabetized-v0.92.txt" #http://web.stanford.edu/class/cs124/NRC-emotion-lexicon-wordlevel-alphabetized-v0.92.txt
    emolex_df = pd.read_csv(os.path.join(cw_path, filepath),  names=["word", "emotion", "association"], skiprows=45, sep='\t')
    emolex_words = emolex_df.pivot(index='word', columns='emotion', values='association').reset_index()
    emolex_words.to_csv(index=True)

    for word in final_words:
        if word in emolex_words.values:
            if(emolex_words[emolex_words.word == word].anger.values[0] ==1):
                emotion_list.append("anger")
            if(emolex_words[emolex_words.word == word].anticipation.values[0] ==1): 
                emotion_list.append("anticipation")
            if(emolex_words[emolex_words.word == word].disgust.values[0] ==1):
                emotion_list.append("disgust")
            if(emolex_words[emolex_words.word == word].fear.values[0] ==1):
                emotion_list.append("fear")
            if(emolex_words[emolex_words.word == word].joy.values[0] ==1):
                emotion_list.append("joy")
            if(emolex_words[emolex_words.word == word].negative.values[0] ==1):
                emotion_list.append("negative")
            if(emolex_words[emolex_words.word == word].positive.values[0] ==1):
                emotion_list.append("positive")
            if(emolex_words[emolex_words.word == word].sadness.values[0] ==1):
                emotion_list.append("sadness")
            if(emolex_words[emolex_words.word == word].surprise.values[0] ==1):
                emotion_list.append("surprise")
            if(emolex_words[emolex_words.word == word].trust.values[0] ==1):
                emotion_list.append("trust")    

    w = Counter(emotion_list)
    for key in w:
        w[key] = (w[key])/len(final_words)

    data = [emotion_list,w]

    return data

def main():
    # Receive text from params
    text = " ".join(sys.argv[1:])
    # text = "Excelenten noticia!, Ahora también en EEUU, aplican el semáforo covid de México!! 👏🏻👏🏻👏🏻 Lágrim4s Fach4s en 3... 2... 1...!! Azi no ANLO!! Ansina no Andrés Mariel!!! 😂😂😂 #EsUnHonorEstarConObrador #GatellOrgulloMexicano"
    # Define data structure
    individualData = {
        'fullText': "text", 
        'negativity':1.0,
        'neutrality':1.0,
        'positivity':1.0,
        'compound':1.0, 
        'polarity':1.0, 
        'subjectivity':1.0, 
        'anger':1.0, 
        'anticipation':1.0,
        'disgust':1.0,
        'fear':1.0,
        'joy':1.0,
        'negative':1.0,
        'positive':1.0,
        'sadness':1.0,
        'surprise':1.0,
        'trust':1.0 
    }
    try:
        # Clean text
        text = clean_text(text)
        # Translate text
        text = translate_text(text)
        # Get sentiment
        sentiment = get_sentiment(text)
        # Get emotions
        emotions = get_emotions(text)[1]

        individualData['negativity'] = sentiment[0]['neg']
        individualData['neutrality'] = sentiment[0]['neu']
        individualData['positivity'] = sentiment[0]['pos']
        individualData['compound'] = sentiment[0]['compound']
        individualData['polarity'] = sentiment[1]
        individualData['subjectivity'] = sentiment[2]

        for emotion in emotions:
            # print(emotion)
            individualData[emotion] = emotions[emotion]
    except:
        individualData['error'] = 1
    print(individualData)
    # print(individualData)
    return 0

if __name__ == "__main__":
    main()