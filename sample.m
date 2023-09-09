% sample.m

% given a probability distribution (vector of probabilities that add to 1),
% returns a position (index) for a vector of the same length, with the
% corresponding probability.

% i.e., if headings = [0 1.5 3 6 12] and you want to generate a sample with
% probability probDist = [0.35 0.25 0.25 0.1 0.05], you would just do:
% thisHeading = headings(sample(probDist));

% --CF ported it from DeadlineShapes in Javascript (by ChatGPT, lol)


function samp = sample(distribution)

samp = nan;
randomNumber = rand;
cumulative = 0;
for i = 1:length(distribution)
    cumulative = cumulative + distribution(i);
    if randomNumber < cumulative
        samp = i;
        break
    end
end

end