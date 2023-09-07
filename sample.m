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