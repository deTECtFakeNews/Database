from newspaper import Article

def main():
    url = 'https://www.periodicoelrayo.com/secciones/ciencia-y-tecnolog%C3%ADa/there-is-not-an-app-for-that'
    article = Article(url)
    article.download()
    article.parse()
    article.nlp()
    metadata = {
        "authors": article.authors,
        "publish_date": article.publish_date, 
        "title": article.title, 
        "keywords": article.keywords,
        "summary": article.summary
    }
    print(metadata)

if __name__ == "__main__":
    main()
