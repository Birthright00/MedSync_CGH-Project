from bs4 import BeautifulSoup

def strip_html(html_content):
    return BeautifulSoup(html_content, "html.parser").get_text()