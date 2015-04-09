import os
import csv
import sys
from lxml import etree

from elasticsearch import Elasticsearch

es = Elasticsearch()

# be careful
es.indices.delete(index='videos')
es.indices.create(index='videos', ignore=400)

def add_to_elastic(id, keywords):
    es.index(index='videos', doc_type='eporner', 
    	id=id, 
    	body={
        	"keywords": keywords 
    	})

# get data.xml from http://www.eporner.com/api_xml/all/1000000
xml = etree.parse('data.xml')

for movie in xml.getroot():
	add_to_elastic(movie.findtext('id'), movie.findtext('keywords').split(','))
	print movie.findtext('id')


