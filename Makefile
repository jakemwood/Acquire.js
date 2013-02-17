test: test-coverage
	@ACQUIRE_COV=1 mocha -u tdd

test-coverage:
	rm -rf lib-cov
	jscoverage lib lib-cov
	@ACQUIRE_COV=1 mocha -u tdd --reporter html-cov > ./docs/test_coverage.html

.PHONY: test test-coverage
