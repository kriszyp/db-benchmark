This is for benchmarking different key-value stores and databases through their NodeJS interfaces. Not only is the database important, but the implementation of the interface can have a tremendous impact on the overall performance of database/store interaction through NodeJS.

Benchmarking was done on Node 16.6.1, with 3.4Ghz i7-4770 Windows, using JS numbers from 0 < 10000 as keys, retrieving data from the database (random access), and decoding the data into a structured object with 10 properties.

For the redis benchmarks, a local redis server must be installed. If anyone has any tips for tuning or improving the performance of the dbs in this benchmarks, would be happy to include that for the sake of fair comparison.

