This is for benchmarking different key-value stores and databases. For the redis benchmarks, a local redis server must be installed. If anyone has any tips for tuning or improving the performance of the dbs in this benchmarks, would be happy to include that for the sake of fair comparison.

Benchmarking was done on Node 16.6.1, with 3.4Ghz i7-4770 Windows, using JS numbers from 0 < 10000 as keys, retrieving data from the database (random access), and decoding the data into a structured object with 10 properties.